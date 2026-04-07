import type {
  MissionMetrics,
  MissionPhase,
  MissionTimelineEvent,
  TrajectoryPoint,
  Vector3,
} from ""

function magnitude(vector: Vector3): number {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)
}

function subtract(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

function distance(a: Vector3, b: Vector3): number {
  return magnitude(subtract(a, b))
}

export function computeSpeedKmPerSec(point: TrajectoryPoint): number {
  if (!point.velocity) return 0
  return magnitude(point.velocity)
}

export function computeDistanceFromEarthKm(point: TrajectoryPoint): number {
  return magnitude(point.position)
}

export function computeDistanceFromMoonKm(
  point: TrajectoryPoint,
  moonPosition: Vector3
): number {
  return distance(point.position, moonPosition)
}

export function computeCumulativeDistanceKm(points: TrajectoryPoint[]): number {
  if (points.length < 2) return 0

  let total = 0

  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i].position, points[i - 1].position)
  }

  return total
}

export function computeElapsedSeconds(
  currentTimestamp: string,
  launchTime: string
): number {
  return Math.max(
    0,
    (new Date(currentTimestamp).getTime() - new Date(launchTime).getTime()) / 1000
  )
}

export function computeRemainingSeconds(
  currentTimestamp: string,
  plannedEndTime: string
): number {
  return Math.max(
    0,
    (new Date(plannedEndTime).getTime() - new Date(currentTimestamp).getTime()) / 1000
  )
}

export function computeProgressPercent(
  currentTimestamp: string,
  launchTime: string,
  plannedEndTime: string
): number {
  const total =
    (new Date(plannedEndTime).getTime() - new Date(launchTime).getTime()) / 1000

  if (total <= 0) return 0

  const elapsed = computeElapsedSeconds(currentTimestamp, launchTime)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

export function findClosestNominalPoint(
  actualPoint: TrajectoryPoint,
  nominalPoints: TrajectoryPoint[]
): TrajectoryPoint | null {
  if (nominalPoints.length === 0) return null

  const actualTime = new Date(actualPoint.timestamp).getTime()

  let bestPoint = nominalPoints[0]
  let smallestTimeDelta = Math.abs(
    new Date(nominalPoints[0].timestamp).getTime() - actualTime
  )

  for (let i = 1; i < nominalPoints.length; i += 1) {
    const delta = Math.abs(new Date(nominalPoints[i].timestamp).getTime() - actualTime)
    if (delta < smallestTimeDelta) {
      smallestTimeDelta = delta
      bestPoint = nominalPoints[i]
    }
  }

  return bestPoint
}

export function computeDeviationFromNominalKm(
  actualPoint: TrajectoryPoint,
  nominalPoints: TrajectoryPoint[]
): number {
  const reference = findClosestNominalPoint(actualPoint, nominalPoints)
  if (!reference) return 0
  return distance(actualPoint.position, reference.position)
}

export function getMissionPhase(
  currentTimestamp: string,
  timeline: MissionTimelineEvent[]
): MissionPhase {
  const currentTime = new Date(currentTimestamp).getTime()

  let phase: MissionPhase = "Launch"

  for (const event of timeline) {
    const eventTime = new Date(event.timestamp).getTime()
    if (currentTime >= eventTime) {
      phase = event.phase
    }
  }

  return phase
}

export function computeMissionMetrics(args: {
  point: TrajectoryPoint
  allActualPoints: TrajectoryPoint[]
  nominalPoints: TrajectoryPoint[]
  moonPosition: Vector3
  launchTime: string
  plannedEndTime: string
  timeline: MissionTimelineEvent[]
}): MissionMetrics {
  const {
    point,
    allActualPoints,
    nominalPoints,
    moonPosition,
    launchTime,
    plannedEndTime,
    timeline,
  } = args

  return {
    timestamp: point.timestamp,
    speedKmPerSec: computeSpeedKmPerSec(point),
    distanceFromEarthKm: computeDistanceFromEarthKm(point),
    distanceFromMoonKm: computeDistanceFromMoonKm(point, moonPosition),
    cumulativeDistanceKm: computeCumulativeDistanceKm(allActualPoints),
    elapsedSeconds: computeElapsedSeconds(point.timestamp, launchTime),
    remainingSeconds: computeRemainingSeconds(point.timestamp, plannedEndTime),
    progressPercent: computeProgressPercent(
      point.timestamp,
      launchTime,
      plannedEndTime
    ),
    deviationFromNominalKm: computeDeviationFromNominalKm(point, nominalPoints),
    missionPhase: getMissionPhase(point.timestamp, timeline),
  }
}