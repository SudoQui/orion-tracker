import { readFile } from "fs/promises"
import path from "path"

import type { DashboardData, MissionConfig } from "@/types/mission"
import type {
  BurnWindow,
  ClosestApproachPrediction,
  CommsStatus,
  ReentryCorridor,
  TrajectoryPoint,
  Vector3,
} from "@/types/trajectory"
import {
  buildPathUntilTime,
  buildTrajectorySamplesBetween,
  computeDistanceFromMoonKm,
  computeMissionMetrics,
  getTimestampMs,
  interpolateTrajectoryAtTime,
} from "@/lib/math/trajectory"

const SPEED_OF_LIGHT_KM_PER_SECOND = 299_792.458
const DEMO_LOOP_SECONDS = 480
const REFRESH_INTERVAL_SECONDS = 5
const PREDICTION_WINDOW_HOURS = 24

async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", relativePath)
  const fileContents = await readFile(filePath, "utf-8")
  return JSON.parse(fileContents) as T
}

async function getMissionConfig(): Promise<MissionConfig> {
  return readJsonFile<MissionConfig>(path.join("data", "mission-config.json"))
}

async function getNominalTrajectory(): Promise<TrajectoryPoint[]> {
  return readJsonFile<TrajectoryPoint[]>(
    path.join("data", "nominal-trajectory.json")
  )
}

async function getActualTrajectory(): Promise<TrajectoryPoint[]> {
  return readJsonFile<TrajectoryPoint[]>(
    path.join("data", "actual-trajectory.json")
  )
}

function getDemoCurrentTimeMs(actualTrajectory: TrajectoryPoint[]): number {
  const startMs = getTimestampMs(actualTrajectory[0].timestamp)
  const endMs = getTimestampMs(actualTrajectory[actualTrajectory.length - 1].timestamp)
  const fraction = ((Date.now() / 1000) % DEMO_LOOP_SECONDS) / DEMO_LOOP_SECONDS
  return startMs + (endMs - startMs) * fraction
}

function getTimelineTime(config: MissionConfig, eventId: string, fallback: string): string {
  const event = config.timeline.find((timelineEvent) => timelineEvent.id === eventId)
  return event?.timestamp ?? fallback
}

function getBurnWindows(config: MissionConfig, currentTimeMs: number): BurnWindow[] {
  const windows: Omit<BurnWindow, "status">[] = [
    {
      id: "tli-burn",
      label: "TLI Burn Window",
      startTime: getTimelineTime(config, "tli", config.launchTime),
      endTime: new Date(
        getTimestampMs(getTimelineTime(config, "tli", config.launchTime)) + 45 * 60 * 1000
      ).toISOString(),
      deltaVms: 3150,
      objective: "Commit Orion to translunar injection trajectory",
    },
    {
      id: "midcourse-burn",
      label: "Outbound Correction",
      startTime: new Date(
        getTimestampMs(getTimelineTime(config, "lunar-flyby", config.launchTime)) - 8 * 60 * 60 * 1000
      ).toISOString(),
      endTime: new Date(
        getTimestampMs(getTimelineTime(config, "lunar-flyby", config.launchTime)) - 7 * 60 * 60 * 1000
      ).toISOString(),
      deltaVms: 26,
      objective: "Refine closest approach geometry before lunar flyby",
    },
    {
      id: "reentry-targeting",
      label: "Reentry Targeting Burn",
      startTime: new Date(
        getTimestampMs(getTimelineTime(config, "reentry", config.plannedEndTime)) - 10 * 60 * 60 * 1000
      ).toISOString(),
      endTime: new Date(
        getTimestampMs(getTimelineTime(config, "reentry", config.plannedEndTime)) - 9 * 60 * 60 * 1000
      ).toISOString(),
      deltaVms: 18,
      objective: "Tighten the Earth return corridor and splashdown aim point",
    },
  ]

  return windows.map((window) => {
    const startMs = getTimestampMs(window.startTime)
    const endMs = getTimestampMs(window.endTime)

    let status: BurnWindow["status"] = "Upcoming"

    if (currentTimeMs > endMs) {
      status = "Completed"
    } else if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
      status = "Active"
    }

    return {
      ...window,
      status,
    }
  })
}

function deriveCommsStatus(
  distanceFromEarthKm: number,
  currentTimeMs: number
): CommsStatus {
  const stations: CommsStatus["station"][] = ["Goldstone", "Madrid", "Canberra"]
  const stationIndex = Math.floor((currentTimeMs / (1000 * 60 * 90)) % stations.length)
  const station = stations[stationIndex]

  const distanceRatio = Math.min(1, distanceFromEarthKm / 420000)
  const oscillation = Math.sin(currentTimeMs / (1000 * 60 * 8)) * 1.8
  const signalStrengthDb = -(74 + distanceRatio * 24) + oscillation
  const roundTripLightTimeSeconds =
    (2 * distanceFromEarthKm) / SPEED_OF_LIGHT_KM_PER_SECOND
  const uplinkKbps = Math.max(4.5, 36 - distanceRatio * 22)
  const downlinkMbps = Math.max(0.8, 12 - distanceRatio * 7.4)

  let status: CommsStatus["status"] = "Nominal"

  if (signalStrengthDb > -88) {
    status = "High Gain Lock"
  } else if (signalStrengthDb < -97) {
    status = "Attenuated"
  }

  return {
    station,
    signalStrengthDb,
    roundTripLightTimeSeconds,
    uplinkKbps,
    downlinkMbps,
    status,
  }
}

function deriveClosestApproach(
  futurePath: TrajectoryPoint[],
  moonPosition: Vector3
): ClosestApproachPrediction {
  if (futurePath.length === 0) {
    return {
      target: "Moon",
      timestamp: new Date().toISOString(),
      distanceKm: 0,
    }
  }

  let bestPoint = futurePath[0]
  let smallestDistance = computeDistanceFromMoonKm(futurePath[0], moonPosition)

  for (let i = 1; i < futurePath.length; i += 1) {
    const candidateDistance = computeDistanceFromMoonKm(futurePath[i], moonPosition)
    if (candidateDistance < smallestDistance) {
      smallestDistance = candidateDistance
      bestPoint = futurePath[i]
    }
  }

  return {
    target: "Moon",
    timestamp: bestPoint.timestamp,
    distanceKm: smallestDistance,
  }
}

function deriveReentryCorridor(nominalTrajectory: TrajectoryPoint[]): ReentryCorridor {
  if (nominalTrajectory.length < 2) {
    return {
      visible: false,
      path: [],
    }
  }

  const last = nominalTrajectory[nominalTrajectory.length - 1].position
  const previous = nominalTrajectory[nominalTrajectory.length - 2].position

  const dx = last.x - previous.x
  const dy = last.y - previous.y
  const length = Math.hypot(dx, dy) || 1

  const normalX = -dy / length
  const normalY = dx / length

  return {
    visible: true,
    path: [
      {
        x: previous.x + normalX * 18000,
        y: previous.y + normalY * 18000,
        z: 0,
      },
      {
        x: previous.x - normalX * 18000,
        y: previous.y - normalY * 18000,
        z: 0,
      },
      {
        x: 15000 - normalX * 7000,
        y: -14000 - normalY * 7000,
        z: 0,
      },
      {
        x: 15000 + normalX * 7000,
        y: -14000 + normalY * 7000,
        z: 0,
      },
    ],
  }
}

export async function getLiveDashboardData(): Promise<DashboardData> {
  const [config, nominalTrajectory, rawActualTrajectory] = await Promise.all([
    getMissionConfig(),
    getNominalTrajectory(),
    getActualTrajectory(),
  ])

  if (nominalTrajectory.length === 0 || rawActualTrajectory.length === 0) {
    throw new Error("Trajectory data is empty.")
  }

  const currentTimeMs = getDemoCurrentTimeMs(rawActualTrajectory)
  const currentActualPoint = interpolateTrajectoryAtTime(rawActualTrajectory, currentTimeMs)
  const actualPath = buildPathUntilTime(rawActualTrajectory, currentTimeMs)

  const predictionEndMs = Math.min(
    currentTimeMs + PREDICTION_WINDOW_HOURS * 60 * 60 * 1000,
    getTimestampMs(nominalTrajectory[nominalTrajectory.length - 1].timestamp)
  )

  const nominalPath = nominalTrajectory
  const futureNominalSamples =
    predictionEndMs > currentTimeMs
      ? buildTrajectorySamplesBetween(
          nominalTrajectory,
          currentTimeMs,
          predictionEndMs,
          60 * 60 * 1000
        )
      : []

  const predictedPath =
    futureNominalSamples.length > 0
      ? [
          currentActualPoint,
          ...futureNominalSamples.slice(1).map((point) => ({
            ...point,
            velocity: point.velocity,
          })),
        ]
      : [currentActualPoint]

  const latestMetrics = computeMissionMetrics({
    point: currentActualPoint,
    allActualPoints: [...actualPath, currentActualPoint],
    nominalPoints: nominalTrajectory,
    moonPosition: config.moonReferencePosition,
    launchTime: config.launchTime,
    plannedEndTime: config.plannedEndTime,
    timeline: config.timeline,
  })

  const comms = deriveCommsStatus(latestMetrics.distanceFromEarthKm, currentTimeMs)
  const burnWindows = getBurnWindows(config, currentTimeMs)
  const nextClosestApproach = deriveClosestApproach(
    predictedPath,
    config.moonReferencePosition
  )
  const reentryCorridor = deriveReentryCorridor(nominalTrajectory)

  return {
    config,
    actualPath: [...actualPath, currentActualPoint],
    nominalPath,
    predictedPath,
    currentActualPoint,
    latestMetrics,
    comms,
    burnWindows,
    nextClosestApproach,
    reentryCorridor,
    lastUpdated: new Date().toISOString(),
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS,
  }
}