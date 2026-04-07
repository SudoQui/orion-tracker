import { readFile } from "fs/promises"
import path from "path"

import type { MissionConfig } from "@/types/mission"
import type { MissionMetrics, TrajectoryPoint } from "@/types/trajectory"
import { computeMissionMetrics } from "@/lib/math/trajectory"

async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", relativePath)
  const fileContents = await readFile(filePath, "utf-8")
  return JSON.parse(fileContents) as T
}

export async function getMissionConfig(): Promise<MissionConfig> {
  return readJsonFile<MissionConfig>(path.join("data", "mission-config.json"))
}

export async function getNominalTrajectory(): Promise<TrajectoryPoint[]> {
  return readJsonFile<TrajectoryPoint[]>(
    path.join("data", "nominal-trajectory.json")
  )
}

export async function getActualTrajectory(): Promise<TrajectoryPoint[]> {
  return readJsonFile<TrajectoryPoint[]>(
    path.join("data", "actual-trajectory.json")
  )
}

export async function getMissionDashboardData(): Promise<{
  config: MissionConfig
  nominalTrajectory: TrajectoryPoint[]
  actualTrajectory: TrajectoryPoint[]
  latestMetrics: MissionMetrics
}> {
  const [config, nominalTrajectory, actualTrajectory] = await Promise.all([
    getMissionConfig(),
    getNominalTrajectory(),
    getActualTrajectory(),
  ])

  if (actualTrajectory.length === 0) {
    throw new Error("Actual trajectory data is empty.")
  }

  const latestPoint = actualTrajectory[actualTrajectory.length - 1]

  const latestMetrics = computeMissionMetrics({
    point: latestPoint,
    allActualPoints: actualTrajectory,
    nominalPoints: nominalTrajectory,
    moonPosition: config.moonReferencePosition,
    launchTime: config.launchTime,
    plannedEndTime: config.plannedEndTime,
    timeline: config.timeline,
  })

  return {
    config,
    nominalTrajectory,
    actualTrajectory,
    latestMetrics,
  }
}