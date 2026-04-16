import { useMemo } from "react"

import type { TrajectoryPoint, Vector3 } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type OrbitViewProps = {
  actualTrajectory: TrajectoryPoint[]
  futureTrajectory: TrajectoryPoint[]
  moonActualPath: TrajectoryPoint[]
  moonFuturePath: TrajectoryPoint[]
  currentMoonPosition: Vector3
  currentTimestamp: string
}

type Point2D = {
  x: number
  y: number
}

const VIEWBOX_WIDTH = 1600
const VIEWBOX_HEIGHT = 900
const PADDING = 110
const ZOOM_FACTOR = 1.12
const PLANET_SCALE = 1.3

function rotateClockwise90(point: Vector3): Vector3 {
  return {
    x: point.y,
    y: -point.x,
    z: point.z,
  }
}

function getBounds(points: Vector3[]) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function createProjector(points: Vector3[]) {
  const bounds = getBounds(points)
  const spanX = Math.max(bounds.maxX - bounds.minX, 1)
  const spanY = Math.max(bounds.maxY - bounds.minY, 1)

  const baseScale = Math.min(
    (VIEWBOX_WIDTH - PADDING * 2) / spanX,
    (VIEWBOX_HEIGHT - PADDING * 2) / spanY
  )

  const scale = baseScale * ZOOM_FACTOR

  const offsetX = VIEWBOX_WIDTH / 2 - ((bounds.minX + bounds.maxX) / 2) * scale
  const offsetY = VIEWBOX_HEIGHT / 2 + ((bounds.minY + bounds.maxY) / 2) * scale

  return (point: Vector3): Point2D => ({
    x: point.x * scale + offsetX,
    y: offsetY - point.y * scale,
  })
}

function pathFromTrajectory(
  points: TrajectoryPoint[],
  project: (point: Vector3) => Point2D
): string {
  if (points.length === 0) return ""

  return points
    .map((point, index) => {
      const rotated = rotateClockwise90(point.position)
      const projected = project(rotated)
      return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`
    })
    .join(" ")
}

function mergeTrajectorySegments(
  primary: TrajectoryPoint[],
  secondary: TrajectoryPoint[]
): TrajectoryPoint[] {
  const merged = [...primary, ...secondary].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const deduped = new Map<string, TrajectoryPoint>()

  for (const point of merged) {
    if (!deduped.has(point.timestamp)) {
      deduped.set(point.timestamp, point)
    }
  }

  return [...deduped.values()]
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

function getEarthDepartureSegment(
  points: TrajectoryPoint[],
  departureRadiusKm = 120000
): TrajectoryPoint[] {
  if (points.length === 0) return []

  const segment: TrajectoryPoint[] = []

  for (const point of points) {
    segment.push(point)

    const distanceFromEarth = Math.hypot(point.position.x, point.position.y)
    if (segment.length > 8 && distanceFromEarth > departureRadiusKm) {
      break
    }
  }

  return segment
}

function computeEarthRounds(points: TrajectoryPoint[]): number {
  if (points.length < 2) return 0

  let totalAngleChange = 0
  let previousAngle = Math.atan2(points[0].position.y, points[0].position.x)

  for (let index = 1; index < points.length; index += 1) {
    const currentAngle = Math.atan2(points[index].position.y, points[index].position.x)
    let delta = currentAngle - previousAngle

    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2

    totalAngleChange += delta
    previousAngle = currentAngle
  }

  return Math.abs(totalAngleChange) / (Math.PI * 2)
}

export default function OrbitView({
  actualTrajectory,
  futureTrajectory,
  moonActualPath,
  moonFuturePath,
  currentMoonPosition,
  currentTimestamp,
}: OrbitViewProps) {
  const fullOrionTrajectory = useMemo(
    () => mergeTrajectorySegments(actualTrajectory, futureTrajectory),
    [actualTrajectory, futureTrajectory]
  )
  const fullMoonTrajectory = useMemo(
    () => mergeTrajectorySegments(moonActualPath, moonFuturePath),
    [moonActualPath, moonFuturePath]
  )
  const departureSegment = useMemo(
    () => getEarthDepartureSegment(fullOrionTrajectory),
    [fullOrionTrajectory]
  )
  const earthRounds = useMemo(
    () => computeEarthRounds(departureSegment),
    [departureSegment]
  )

  const rotatedEarth = useMemo(() => rotateClockwise90({ x: 0, y: 0, z: 0 }), [])
  const rotatedCurrentMoon = useMemo(
    () => rotateClockwise90(currentMoonPosition),
    [currentMoonPosition]
  )
  const rotatedVectors = useMemo(
    () => [
      ...fullOrionTrajectory.map((point) => rotateClockwise90(point.position)),
      ...fullMoonTrajectory.map((point) => rotateClockwise90(point.position)),
      rotatedCurrentMoon,
      rotatedEarth,
    ],
    [fullOrionTrajectory, fullMoonTrajectory, rotatedCurrentMoon, rotatedEarth]
  )
  const project = useMemo(() => createProjector(rotatedVectors), [rotatedVectors])

  const actualPath = useMemo(
    () => pathFromTrajectory(actualTrajectory, project),
    [actualTrajectory, project]
  )
  const futurePath = useMemo(
    () => pathFromTrajectory(futureTrajectory, project),
    [futureTrajectory, project]
  )
  const moonActualSvgPath = useMemo(
    () => pathFromTrajectory(moonActualPath, project),
    [moonActualPath, project]
  )
  const moonFutureSvgPath = useMemo(
    () => pathFromTrajectory(moonFuturePath, project),
    [moonFuturePath, project]
  )
  const departurePath = useMemo(
    () => pathFromTrajectory(departureSegment, project),
    [departureSegment, project]
  )

  const earthPoint = project(rotatedEarth)
  const moonPoint = project(rotatedCurrentMoon)
  const currentTrajectoryPoint =
    actualTrajectory[actualTrajectory.length - 1] ??
    fullOrionTrajectory[fullOrionTrajectory.length - 1] ?? {
      timestamp: currentTimestamp,
      position: { x: 0, y: 0, z: 0 },
    }
  const currentPoint = project(rotateClockwise90(currentTrajectoryPoint.position))

  const moonOrbitRadius = computeMedian(
    fullMoonTrajectory.map((point) => {
      const projectedPoint = project(rotateClockwise90(point.position))
      return Math.hypot(projectedPoint.x - earthPoint.x, projectedPoint.y - earthPoint.y)
    })
  )

  const earthSize = 184 * PLANET_SCALE
  const moonSize = 124 * PLANET_SCALE
  const rocketSize = 112

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Mission map</h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Earth-centered inertial replay
          </p>
        </div>

        <div className="text-xs text-slate-500 sm:text-sm">
          Current mission time: {formatTimestamp(currentTimestamp)}
        </div>
      </div>

      <div className="p-1.5 sm:p-2">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="block h-auto w-full rounded-2xl bg-[#030712]"
        >
          <defs>
            <pattern id="smallGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="rgba(56,189,248,0.05)"
                strokeWidth="1"
              />
            </pattern>

            <pattern id="largeGrid" width="180" height="180" patternUnits="userSpaceOnUse">
              <rect width="180" height="180" fill="url(#smallGrid)" />
              <path
                d="M 180 0 L 0 0 0 180"
                fill="none"
                stroke="rgba(56,189,248,0.08)"
                strokeWidth="1.2"
              />
            </pattern>

            <pattern id="stars" width="220" height="220" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="30" r="1.3" fill="white" opacity="0.55" />
              <circle cx="60" cy="130" r="1.1" fill="white" opacity="0.4" />
              <circle cx="130" cy="70" r="1.5" fill="white" opacity="0.5" />
              <circle cx="180" cy="25" r="1.1" fill="white" opacity="0.35" />
              <circle cx="200" cy="180" r="1.6" fill="white" opacity="0.55" />
              <circle cx="95" cy="190" r="1.1" fill="white" opacity="0.4" />
            </pattern>

            <linearGradient id="actualStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>

            <linearGradient id="futureStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="#020617" />
          <rect width="100%" height="100%" fill="url(#stars)" />
          <rect width="100%" height="100%" fill="url(#largeGrid)" />
          <circle
            cx={earthPoint.x}
            cy={earthPoint.y}
            r={moonOrbitRadius}
            fill="none"
            stroke="rgba(148,163,184,0.42)"
            strokeWidth="2.6"
            strokeDasharray="12 10"
          />

          <path
            d={departurePath}
            fill="none"
            stroke="rgba(250,204,21,0.7)"
            strokeWidth="4"
            strokeDasharray="8 7"
            strokeLinecap="round"
          />

          <path
            d={moonActualSvgPath}
            fill="none"
            stroke="rgba(229,231,235,0.55)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d={moonFutureSvgPath}
            fill="none"
            stroke="rgba(229,231,235,0.35)"
            strokeWidth="3"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />

          <path
            d={actualPath}
            fill="none"
            stroke="url(#actualStroke)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          <path
            d={futurePath}
            fill="none"
            stroke="url(#futureStroke)"
            strokeWidth="5"
            strokeDasharray="12 10"
            strokeLinecap="round"
            opacity="0.95"
          />

          <image
            href="/images/earth.svg"
            x={earthPoint.x - earthSize / 2}
            y={earthPoint.y - earthSize / 2}
            width={earthSize}
            height={earthSize}
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/moon.svg"
            x={moonPoint.x - moonSize / 2}
            y={moonPoint.y - moonSize / 2}
            width={moonSize}
            height={moonSize}
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/orion.svg"
            x={currentPoint.x - rocketSize / 2}
            y={currentPoint.y - rocketSize / 2}
            width={rocketSize}
            height={rocketSize}
            preserveAspectRatio="xMidYMid meet"
          />

          <text
            x={earthPoint.x - 35}
            y={earthPoint.y + 118}
            fill="#93c5fd"
            fontSize="26"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            EARTH
          </text>

          <text
            x={moonPoint.x - 34}
            y={moonPoint.y + 92}
            fill="#e5e7eb"
            fontSize="22"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            MOON
          </text>

          <text
            x={currentPoint.x + 40}
            y={currentPoint.y + 6}
            fill="#facc15"
            fontSize="24"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            ORION
          </text>

          <text
            x={VIEWBOX_WIDTH - 410}
            y={58}
            fill="#facc15"
            fontSize="22"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            EARTH ROUNDS: {earthRounds.toFixed(2)}
          </text>
        </svg>
      </div>
    </div>
  )
}
