import type {
  BurnWindow,
  ClosestApproachPrediction,
  CommsStatus,
  MissionMetrics,
  MissionTimelineEvent,
  ReentryCorridor,
  TrajectoryPoint,
} from "@/types/trajectory"

export type MissionConfig = {
  missionName: string
  vehicleName: string
  launchTime: string
  plannedEndTime: string
  earthRadiusKm: number
  moonRadiusKm: number
  moonReferencePosition: {
    x: number
    y: number
    z: number
  }
  timeline: MissionTimelineEvent[]
}

export type DashboardData = {
  config: MissionConfig
  actualPath: TrajectoryPoint[]
  nominalPath: TrajectoryPoint[]
  predictedPath: TrajectoryPoint[]
  currentActualPoint: TrajectoryPoint
  latestMetrics: MissionMetrics
  comms: CommsStatus
  burnWindows: BurnWindow[]
  nextClosestApproach: ClosestApproachPrediction
  reentryCorridor: ReentryCorridor
  lastUpdated: string
  refreshIntervalSeconds: number
}