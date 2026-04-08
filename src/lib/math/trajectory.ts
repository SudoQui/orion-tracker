import type {
  MissionMetrics,
  MissionPhase,
  MissionTimelineEvent,
  TrajectoryPoint,
  Vector3,
} from "@/types/trajectory"

export function getTimestampMs(timestamp: string): number {
  return new Date(timestamp).getTime()
}

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

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpVector(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerpNumber(a.x, b.x, t),
    y: lerpNumber(a.y, b.y, t),
    z: lerpNumber(a.z, b.z, t),
  }
}

export function interpolateTrajectoryAtTime(
  points: TrajectoryPoint[],
  targetMs: number
): TrajectoryPoint {
  if (points.length === 0) {
    throw new Error("Cannot interpolate an empty trajectory.")
  }

  if (points.length === 1) {
    return {
      ...points[0],
      timestamp: new Date(targetMs).toISOString(),
    }
  }

  const firstTime = getTimestampMs(points[0].timestamp)
  const lastTime = getTimestampMs(points[points.length - 1].timestamp)

  if (targetMs <= firstTime) {
    return {
      ...points[0],
      timestamp: new Date(targetMs).toISOString(),
    }
  }

  if (targetMs >= lastTime) {
    return {
      ...points[points.length - 1],
      timestamp: new Date(targetMs).toISOString(),
    }
  }

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1]
    const current = points[i]
    const previousTime = getTimestampMs(previous.timestamp)
    const currentTime = getTimestampMs(current.timestamp)

    if (targetMs >= previousTime && targetMs <= currentTime) {
      const span = currentTime - previousTime
      const t = span === 0 ? 0 : (targetMs - previousTime) / span

      return {
        timestamp: new Date(targetMs).toISOString(),
        position: lerpVector(previous.position, current.position, t),
        velocity:
          previous.velocity && current.velocity
            ? lerpVector(previous.velocity, current.velocity, t)
            : previous.velocity ?? current.velocity,
      }
    }
  }

  return {
    ...points[points.length - 1],
    timestamp: new Date(targetMs).toISOString(),
  }
}

export function buildPathUntilTime(
  points: TrajectoryPoint[],
  targetMs: number
): TrajectoryPoint[] {
  if (points.length === 0) return []

  const firstTime = getTimestampMs(points[0].timestamp)
  const lastTime = getTimestampMs(points[points.length - 1].timestamp)

  if (targetMs <= firstTime) {
    return [interpolateTrajectoryAtTime(points, targetMs)]
  }

  if (targetMs >= lastTime) {
    return [...points]
  }

  const result: TrajectoryPoint[] = []

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i]
    const currentTime = getTimestampMs(current.timestamp)

    if (currentTime < targetMs) {
      result.push(current)
      continue
    }

    if (currentTime === targetMs) {
      result.push(current)
      return result
    }

    result.push(interpolateTrajectoryAtTime(points, targetMs))
    return result
  }

  return result
}

export function buildTrajectorySamplesBetween(
  points: TrajectoryPoint[],
  startMs: number,
  endMs: number,
  stepMs: number
): TrajectoryPoint[] {
  if (points.length === 0 || endMs <= startMs || stepMs <= 0) return []

  const samples: TrajectoryPoint[] = []
  let currentMs = startMs

  while (currentMs <= endMs) {
    samples.push(interpolateTrajectoryAtTime(points, currentMs))
    currentMs += stepMs
  }

  const lastSampleTime = getTimestampMs(samples[samples.length - 1].timestamp)
  if (lastSampleTime < endMs) {
    samples.push(interpolateTrajectoryAtTime(points, endMs))
  }

  return samples
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
    (getTimestampMs(currentTimestamp) - getTimestampMs(launchTime)) / 1000
  )
}

export function computeRemainingSeconds(
  currentTimestamp: string,
  plannedEndTime: string
): number {
  return Math.max(
    0,
    (getTimestampMs(plannedEndTime) - getTimestampMs(currentTimestamp)) / 1000
  )
}

export function computeProgressPercent(
  currentTimestamp: string,
  launchTime: string,
  plannedEndTime: string
): number {
  const total =
    (getTimestampMs(plannedEndTime) - getTimestampMs(launchTime)) / 1000

  if (total <= 0) return 0

  const elapsed = computeElapsedSeconds(currentTimestamp, launchTime)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

export function findClosestNominalPoint(
  actualPoint: TrajectoryPoint,
  nominalPoints: TrajectoryPoint[]
): TrajectoryPoint | null {
  if (nominalPoints.length === 0) return null

  const actualTime = getTimestampMs(actualPoint.timestamp)

  let bestPoint = nominalPoints[0]
  let smallestTimeDelta = Math.abs(getTimestampMs(nominalPoints[0].timestamp) - actualTime)

  for (let i = 1; i < nominalPoints.length; i += 1) {
    const delta = Math.abs(getTimestampMs(nominalPoints[i].timestamp) - actualTime)
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
  const currentTime = getTimestampMs(currentTimestamp)

  let phase: MissionPhase = "Launch"

  for (const event of timeline) {
    const eventTime = getTimestampMs(event.timestamp)
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