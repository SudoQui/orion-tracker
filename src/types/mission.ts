import type {
  ClosestApproachSummary,
  MissionMetrics,
  MissionTimelineEvent,
  TrajectoryPoint,
  Vector3,
} from "@/types/trajectory"

export type MissionConfig = {
  missionName: string
  vehicleName: string
  launchTime: string
  plannedEndTime: string
  earthRadiusKm: number
  moonRadiusKm: number
  timeline: MissionTimelineEvent[]
}

export type SourceMetadata = {
  trajectorySourceLabel: string
  trajectorySourceUrl: string
  ephemerisZipUrl: string
  moonSourceLabel: string
  moonSourceUrl: string
  referenceFrame: string
  centerName: string
  timeSystem: string
  officialSampleCount: number
  officialEphemerisEndTime: string
}

export type DashboardData = {
  config: MissionConfig
  actualPath: TrajectoryPoint[]
  futurePath: TrajectoryPoint[]
  moonPath: TrajectoryPoint[]
  currentActualPoint: TrajectoryPoint
  currentMoonPoint: Vector3
  latestMetrics: MissionMetrics
  nextClosestApproachToMoon: ClosestApproachSummary
  sourceMetadata: SourceMetadata
  lastUpdated: string
  refreshIntervalSeconds: number
}
