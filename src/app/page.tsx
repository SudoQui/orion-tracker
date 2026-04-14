"use client"

import { useEffect, useMemo, useState } from "react"

import Header from "@/components/layout/Header"
import SectionCard from "@/components/layout/SectionCard"
import MissionStats from "@/components/metrics/MissionStats"
import OrbitView from "@/components/orbit/OrbitView"
import OfficialDataPanel from "@/components/panels/OfficialDataPanel"
import MissionTimeline from "@/components/timeline/MissionTimeline"
import StrobingMessage from "@/components/landing/LandingMessage"
import { formatTimestamp } from "@/lib/formatting/format"
import {
  computeClosestApproachToMoon,
  computeMissionMetrics,
  getTimestampMs,
  interpolateTrajectoryAtTime,
} from "@/lib/math/trajectory"
import type { DashboardData, SourceMetadata } from "@/types/mission"
import type { TrajectoryPoint } from "@/types/trajectory"

const LINKEDIN_URL = "https://www.linkedin.com/in/mustafa-siddiqui-32ab73161/"
const GITHUB_URL = "https://github.com/SudoQui/orion-tracker"
const REPLAY_DURATION_MS = 42000
const REPLAY_SAMPLE_COUNT = 2200
const MISSION_END_TOLERANCE_MS = 12 * 60 * 60 * 1000
const SYNTHETIC_MOON_PERIOD_DAYS = 27.321661

function buildFallbackSourceMetadata(data: DashboardData | null): SourceMetadata {
  const fallbackTimestamp =
    data?.currentActualPoint?.timestamp ??
    data?.lastUpdated ??
    new Date().toISOString()

  return {
    trajectorySourceLabel: "NASA Artemis Real-Time Orbit Website ephemeris",
    trajectorySourceUrl:
      "https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/",
    ephemerisZipUrl: "",
    moonSourceLabel: "JPL Horizons Moon vectors",
    moonSourceUrl: "https://ssd.jpl.nasa.gov/api/horizons.api",
    referenceFrame: "ICRF",
    centerName: "Earth",
    timeSystem: "UT",
    officialSampleCount: data?.actualPath?.length ?? 0,
    officialEphemerisEndTime: fallbackTimestamp,
  }
}

function sortByTimestamp(points: TrajectoryPoint[]): TrajectoryPoint[] {
  return [...points].sort(
    (a, b) => getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp)
  )
}

function mergeTrajectorySegments(
  primary: TrajectoryPoint[],
  secondary: TrajectoryPoint[]
): TrajectoryPoint[] {
  const merged = [...sortByTimestamp(primary), ...sortByTimestamp(secondary)]
  const deduped = new Map<string, TrajectoryPoint>()

  for (const point of merged) {
    if (!deduped.has(point.timestamp)) {
      deduped.set(point.timestamp, point)
    }
  }

  return [...deduped.values()]
}

function getTrajectoryDurationMs(points: TrajectoryPoint[]): number {
  if (points.length < 2) return 0
  return (
    getTimestampMs(points[points.length - 1].timestamp) -
    getTimestampMs(points[0].timestamp)
  )
}

function chooseReplayTrajectory(args: {
  officialTrajectory: TrajectoryPoint[]
  fallbackTrajectory: TrajectoryPoint[]
  timeline: DashboardData["config"]["timeline"]
}): TrajectoryPoint[] {
  const official = sortByTimestamp(args.officialTrajectory)
  const fallback = sortByTimestamp(args.fallbackTrajectory)
  const missionEndMs =
    args.timeline.length > 0
      ? getTimestampMs(args.timeline[args.timeline.length - 1].timestamp)
      : null

  const officialEndMs =
    official.length > 0 ? getTimestampMs(official[official.length - 1].timestamp) : 0
  const fallbackEndMs =
    fallback.length > 0 ? getTimestampMs(fallback[fallback.length - 1].timestamp) : 0

  const officialCoversMission =
    missionEndMs === null ||
    officialEndMs + MISSION_END_TOLERANCE_MS >= missionEndMs

  const fallbackCoversMission =
    missionEndMs === null ||
    fallbackEndMs + MISSION_END_TOLERANCE_MS >= missionEndMs

  if (official.length > 1 && officialCoversMission) {
    return official
  }

  if (fallback.length > 1 && fallbackCoversMission) {
    return fallback
  }

  if (
    official.length > 1 &&
    getTrajectoryDurationMs(official) >= getTrajectoryDurationMs(fallback)
  ) {
    return official
  }

  if (fallback.length > 1) {
    return fallback
  }

  return official
}

function buildReplayTimestamps(
  startMs: number,
  endMs: number,
  sampleCount: number
): number[] {
  if (sampleCount <= 1 || endMs <= startMs) return [startMs]

  const timestamps: number[] = []
  const stepMs = (endMs - startMs) / (sampleCount - 1)

  for (let i = 0; i < sampleCount; i += 1) {
    timestamps.push(Math.round(startMs + stepMs * i))
  }

  return timestamps
}

function sampleTrajectoryAtTimestamps(
  points: TrajectoryPoint[],
  timestampsMs: number[]
): TrajectoryPoint[] {
  const sorted = sortByTimestamp(points)
  if (sorted.length === 0 || timestampsMs.length === 0) return []

  return timestampsMs.map((timestampMs) =>
    interpolateTrajectoryAtTime(sorted, timestampMs)
  )
}

function buildSyntheticMoonOrbit(
  timestampsMs: number[],
  seedPosition: { x: number; y: number; z: number }
): TrajectoryPoint[] {
  if (timestampsMs.length === 0) return []

  const startMs = timestampsMs[0]
  const safeRadius = Math.max(Math.hypot(seedPosition.x, seedPosition.y), 384400)
  const startAngle = Math.atan2(seedPosition.y, seedPosition.x)
  const angularVelocityPerMs =
    (Math.PI * 2) /
    (SYNTHETIC_MOON_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  return timestampsMs.map((timestampMs) => {
    const elapsedMs = timestampMs - startMs
    const angle = startAngle + elapsedMs * angularVelocityPerMs
    const x = safeRadius * Math.cos(angle)
    const y = safeRadius * Math.sin(angle)

    return {
      timestamp: new Date(timestampMs).toISOString(),
      position: { x, y, z: seedPosition.z },
      velocity: {
        x: -safeRadius * Math.sin(angle) * angularVelocityPerMs * 1000,
        y: safeRadius * Math.cos(angle) * angularVelocityPerMs * 1000,
        z: 0,
      },
    }
  })
}

function rotate2D(
  x: number,
  y: number,
  angleRad: number
): { x: number; y: number } {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

function getFarthestPointIndexFromEarth(points: TrajectoryPoint[]): number {
  if (points.length === 0) return 0

  let bestIndex = 0
  let bestRadius = -1

  for (let i = 0; i < points.length; i += 1) {
    const radius = Math.hypot(points[i].position.x, points[i].position.y)
    if (radius > bestRadius) {
      bestRadius = radius
      bestIndex = i
    }
  }

  return bestIndex
}

function computeClosestSeparationKm(
  a: TrajectoryPoint[],
  b: TrajectoryPoint[]
): number {
  const sampleCount = Math.min(a.length, b.length)
  if (sampleCount === 0) return Number.POSITIVE_INFINITY

  let best = Number.POSITIVE_INFINITY

  for (let i = 0; i < sampleCount; i += 1) {
    const dx = a[i].position.x - b[i].position.x
    const dy = a[i].position.y - b[i].position.y
    const dz = a[i].position.z - b[i].position.z
    const distanceKm = Math.hypot(dx, dy, dz)

    if (distanceKm < best) {
      best = distanceKm
    }
  }

  return best
}

function alignMoonTrajectoryWithOrionFlyby(
  moonTrajectory: TrajectoryPoint[],
  orionTrajectory: TrajectoryPoint[]
): TrajectoryPoint[] {
  if (moonTrajectory.length < 2 || orionTrajectory.length < 2) {
    return moonTrajectory
  }

  const alignmentIndex = Math.min(
    getFarthestPointIndexFromEarth(orionTrajectory),
    moonTrajectory.length - 1
  )

  const orionFlyby = orionTrajectory[alignmentIndex].position
  const moonFlyby = moonTrajectory[alignmentIndex].position

  const targetAngle = Math.atan2(orionFlyby.y, orionFlyby.x)
  const currentAngle = Math.atan2(moonFlyby.y, moonFlyby.x)
  const deltaAngle = targetAngle - currentAngle

  return moonTrajectory.map((point) => {
    const rotatedPosition = rotate2D(point.position.x, point.position.y, deltaAngle)
    const rotatedVelocity = point.velocity
      ? rotate2D(point.velocity.x, point.velocity.y, deltaAngle)
      : null

    return {
      ...point,
      position: {
        x: rotatedPosition.x,
        y: rotatedPosition.y,
        z: point.position.z,
      },
      velocity: rotatedVelocity
        ? {
            x: rotatedVelocity.x,
            y: rotatedVelocity.y,
            z: point.velocity?.z ?? 0,
          }
        : point.velocity,
    }
  })
}

type ReplayBundle = {
  replayStartMs: number
  replayEndMs: number
  replayOrionTrajectory: TrajectoryPoint[]
  replayMoonTrajectory: TrajectoryPoint[]
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [nominalTrajectory, setNominalTrajectory] = useState<TrajectoryPoint[]>([])

  // Load nominal trajectory data
  useEffect(() => {
    const loadNominalTrajectory = async () => {
      try {
        const response = await fetch("/data/nominal-trajectory.json")
        const trajectoryData = (await response.json()) as TrajectoryPoint[]
        setNominalTrajectory(trajectoryData)
      } catch (err) {
        console.error("Failed to load nominal trajectory:", err)
      }
    }
    void loadNominalTrajectory()
  }, [])

  // Load initial data once (no polling)
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to load dashboard data.")
        }

        const payload = (await response.json()) as DashboardData

        if (isMounted) {
          setData(payload)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unexpected dashboard error."
          )
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const replayBundle = useMemo<ReplayBundle | null>(() => {
    if (!data) return null

    const officialOrionTrajectory = mergeTrajectorySegments(
      data.actualPath,
      data.futurePath
    )

    const replaySource = chooseReplayTrajectory({
      officialTrajectory: officialOrionTrajectory,
      fallbackTrajectory: nominalTrajectory,
      timeline: data.config.timeline,
    })

    if (replaySource.length < 2) return null

    const replayStartMs = getTimestampMs(replaySource[0].timestamp)
    const replayEndMs = getTimestampMs(replaySource[replaySource.length - 1].timestamp)
    const replayTimestampsMs = buildReplayTimestamps(
      replayStartMs,
      replayEndMs,
      REPLAY_SAMPLE_COUNT
    )
    const replayOrionTrajectory = sampleTrajectoryAtTimestamps(
      replaySource,
      replayTimestampsMs
    )

    const officialMoonTrajectory = mergeTrajectorySegments(
      data.moonActualPath,
      data.moonFuturePath
    )
    const moonSeedPosition =
      officialMoonTrajectory[0]?.position ?? data.currentMoonPoint

    const officialMoonStartMs =
      officialMoonTrajectory.length > 0
        ? getTimestampMs(officialMoonTrajectory[0].timestamp)
        : Number.POSITIVE_INFINITY
    const officialMoonEndMs =
      officialMoonTrajectory.length > 0
        ? getTimestampMs(officialMoonTrajectory[officialMoonTrajectory.length - 1].timestamp)
        : Number.NEGATIVE_INFINITY

    const hasMoonCoverage =
      officialMoonTrajectory.length > 1 &&
      officialMoonStartMs <= replayStartMs &&
      officialMoonEndMs >= replayEndMs

    const replayMoonCandidate = hasMoonCoverage
      ? sampleTrajectoryAtTimestamps(officialMoonTrajectory, replayTimestampsMs)
      : buildSyntheticMoonOrbit(replayTimestampsMs, moonSeedPosition)
    const alignedReplayMoonTrajectory = alignMoonTrajectoryWithOrionFlyby(
      replayMoonCandidate,
      replayOrionTrajectory
    )
    const replayMoonTrajectory =
      computeClosestSeparationKm(alignedReplayMoonTrajectory, replayOrionTrajectory) <
      computeClosestSeparationKm(replayMoonCandidate, replayOrionTrajectory)
        ? alignedReplayMoonTrajectory
        : replayMoonCandidate

    return {
      replayStartMs,
      replayEndMs,
      replayOrionTrajectory,
      replayMoonTrajectory,
    }
  }, [data, nominalTrajectory])

  // Auto-run replay loop continuously
  useEffect(() => {
    if (!replayBundle || replayBundle.replayOrionTrajectory.length < 2) return

    let animationFrameId: number
    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = (elapsed % REPLAY_DURATION_MS) / REPLAY_DURATION_MS

      setSimulationProgress(progress)

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [replayBundle])

  const displayData = useMemo<DashboardData | null>(() => {
    if (!data) return null
    if (!replayBundle) return data

    const replayLength = replayBundle.replayOrionTrajectory.length
    if (replayLength < 2 || replayBundle.replayMoonTrajectory.length < 2) {
      return data
    }

    const progressIndex = Math.min(
      Math.floor(simulationProgress * (replayLength - 1)),
      replayLength - 1
    )

    const currentActualPoint =
      replayBundle.replayOrionTrajectory[progressIndex] ??
      replayBundle.replayOrionTrajectory[replayLength - 1]
    const currentMoonSample =
      replayBundle.replayMoonTrajectory[progressIndex] ??
      replayBundle.replayMoonTrajectory[replayBundle.replayMoonTrajectory.length - 1]
    const currentMoonPoint = currentMoonSample.position

    const actualPath = replayBundle.replayOrionTrajectory.slice(0, progressIndex + 1)
    const futurePath = replayBundle.replayOrionTrajectory.slice(progressIndex)
    const moonActualPath = replayBundle.replayMoonTrajectory.slice(0, progressIndex + 1)
    const moonFuturePath = replayBundle.replayMoonTrajectory.slice(progressIndex)

    const flownClosestApproachToMoon = computeClosestApproachToMoon(
      actualPath,
      moonActualPath
    )
    const flownClosestApproachMoonPoint = interpolateTrajectoryAtTime(
      replayBundle.replayMoonTrajectory,
      getTimestampMs(flownClosestApproachToMoon.timestamp)
    ).position

    const latestMetrics = computeMissionMetrics({
      point: currentActualPoint,
      allActualPoints: actualPath,
      currentMoonPoint,
      launchTime: data.config.launchTime,
      missionEndTime:
        replayBundle.replayOrionTrajectory[replayBundle.replayOrionTrajectory.length - 1]
          .timestamp,
      timeline: data.config.timeline,
    })

    const simulatedMissionMs =
      replayBundle.replayStartMs +
      (replayBundle.replayEndMs - replayBundle.replayStartMs) * simulationProgress

    return {
      ...data,
      actualPath,
      futurePath,
      moonActualPath,
      moonFuturePath,
      currentActualPoint,
      currentMoonPoint,
      flownClosestApproachToMoon,
      flownClosestApproachMoonPoint,
      latestMetrics,
      lastUpdated: new Date(simulatedMissionMs).toISOString(),
    }
  }, [data, replayBundle, simulationProgress])

  if (!displayData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-8 py-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-300" />
          <p className="mt-4 text-lg font-medium">
            Booting OrionTracker accuracy mode...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Pulling official NASA and JPL vectors
          </p>
        </div>
      </main>
    )
  }

  const safeSourceMetadata = displayData.sourceMetadata ?? buildFallbackSourceMetadata(displayData)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1850px] px-4 py-5 md:px-6 lg:px-8">
        <Header
          missionName={displayData.config.missionName}
          vehicleName={displayData.config.vehicleName}
          statusLabel={`Mission Replay (${Math.round(simulationProgress * 100)}%) - Launch to splashdown`}
          updatedAt={formatTimestamp(displayData.currentActualPoint.timestamp)}
          linkedinUrl={LINKEDIN_URL}
          githubUrl={GITHUB_URL}
        />

        {error ? (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <SectionCard
            title="Mission metrics"
            subtitle="Only official or officially-derived values"
            className="h-fit"
          >
            <MissionStats
              metrics={displayData.latestMetrics}
              replayProgressPercent={simulationProgress * 100}
            />
          </SectionCard>

          <div className="space-y-6">
            <OrbitView
              actualTrajectory={displayData.actualPath}
              futureTrajectory={displayData.futurePath}
              moonActualPath={displayData.moonActualPath}
              moonFuturePath={displayData.moonFuturePath}
              currentMoonPosition={displayData.currentMoonPoint}
              currentTimestamp={displayData.currentActualPoint.timestamp}
            />

            <SectionCard
              title="Official data status"
              subtitle="Source provenance and time-consistent interpretation"
            >
              <OfficialDataPanel
                sourceMetadata={safeSourceMetadata}
                flownClosestApproachToMoon={displayData.flownClosestApproachToMoon}
                futureSampleCount={displayData.futurePath.length}
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Mission timeline"
            subtitle="Current event pinned to the top"
            className="h-fit"
          >
            <StrobingMessage />
            <MissionTimeline
              events={displayData.config.timeline}
              currentTimestamp={displayData.currentActualPoint.timestamp}
            />
          </SectionCard>
        </div>
      </div>
    </main>
  )
}
