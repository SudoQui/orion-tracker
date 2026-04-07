export type Vector3 = {
  x: number
  y: number
  z: number
}

export type TrajectoryPoint = {
  timestamp: string
  position: Vector3
  velocity?: Vector3
}

export type MissionPhase =
  | "Launch"
  | "Earth Orbit Checkout"
  | "Translunar Injection"
  | "Outbound Coast"
  | "Lunar Flyby"
  | "Inbound Coast"
  | "Reentry"

export type MissionTimelineEvent = {
  id: string
  label: string
  phase: MissionPhase
  timestamp: string
  description: string
}

export type MissionMetrics = {
  timestamp: string
  speedKmPerSec: number
  distanceFromEarthKm: number
  distanceFromMoonKm: number
  cumulativeDistanceKm: number
  elapsedSeconds: number
  remainingSeconds: number
  progressPercent: number
  deviationFromNominalKm: number
  missionPhase: MissionPhase
}