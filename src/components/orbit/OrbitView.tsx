import type {
  BurnWindow,
  ReentryCorridor,
  TrajectoryPoint,
  Vector3,
} from "@/types/trajectory"
import {
  getTimestampMs,
  interpolateTrajectoryAtTime,
} from "@/lib/math/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type OrbitViewProps = {
  nominalTrajectory: TrajectoryPoint[]
  actualTrajectory: TrajectoryPoint[]
  predictedTrajectory: TrajectoryPoint[]
  moonPosition: Vector3
  burnWindows: BurnWindow[]
  reentryCorridor: ReentryCorridor
  currentTimestamp: string
}

type Point2D = {
  x: number
  y: number
}

const VIEWBOX_WIDTH = 1600
const VIEWBOX_HEIGHT = 900
const PADDING = 140

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
  const scale = Math.min(
    (VIEWBOX_WIDTH - PADDING * 2) / spanX,
    (VIEWBOX_HEIGHT - PADDING * 2) / spanY
  )

  const offsetX = (VIEWBOX_WIDTH - spanX * scale) / 2 - bounds.minX * scale
  const offsetY = (VIEWBOX_HEIGHT - spanY * scale) / 2 + bounds.maxY * scale

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
      const projected = project(point.position)
      return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`
    })
    .join(" ")
}

function polygonFromVectors(
  points: Vector3[],
  project: (point: Vector3) => Point2D
): string {
  return points
    .map((point) => {
      const projected = project(point)
      return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`
    })
    .join(" ")
}

export default function OrbitView({
  nominalTrajectory,
  actualTrajectory,
  predictedTrajectory,
  moonPosition,
  burnWindows,
  reentryCorridor,
  currentTimestamp,
}: OrbitViewProps) {
  const allVectors = [
    ...nominalTrajectory.map((point) => point.position),
    ...actualTrajectory.map((point) => point.position),
    ...predictedTrajectory.map((point) => point.position),
    moonPosition,
    { x: 0, y: 0, z: 0 },
    ...reentryCorridor.path,
  ]

  const project = createProjector(allVectors)
  const nominalPath = pathFromTrajectory(nominalTrajectory, project)
  const actualPath = pathFromTrajectory(actualTrajectory, project)
  const predictedPath = pathFromTrajectory(predictedTrajectory, project)
  const earthPoint = project({ x: 0, y: 0, z: 0 })
  const moonPoint = project(moonPosition)
  const currentPoint = project(actualTrajectory[actualTrajectory.length - 1].position)

  const burnMarkers = burnWindows.map((window) => {
    const marker = interpolateTrajectoryAtTime(
      nominalTrajectory,
      getTimestampMs(window.startTime)
    )
    return {
      ...window,
      projected: project(marker.position),
    }
  })

  const corridorPoints =
    reentryCorridor.visible && reentryCorridor.path.length >= 3
      ? polygonFromVectors(reentryCorridor.path, project)
      : ""

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Mission map</h2>
          <p className="mt-1 text-sm text-slate-400">
            Full trajectory view with actual, nominal, forecast, and planning overlays
          </p>
        </div>

        <div className="text-sm text-slate-500">
          Current mission time: {formatTimestamp(currentTimestamp)}
        </div>
      </div>

      <div className="p-4">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-[720px] w-full rounded-2xl bg-[#030712]"
        >
          <defs>
            <pattern id="smallGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="1" />
            </pattern>
            <pattern id="largeGrid" width="180" height="180" patternUnits="userSpaceOnUse">
              <rect width="180" height="180" fill="url(#smallGrid)" />
              <path d="M 180 0 L 0 0 0 180" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="1.2" />
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
            <linearGradient id="predictedStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="#020617" />
          <rect width="100%" height="100%" fill="url(#stars)" />
          <rect width="100%" height="100%" fill="url(#largeGrid)" />

          {corridorPoints ? (
            <polygon
              points={corridorPoints}
              fill="rgba(251, 146, 60, 0.12)"
              stroke="rgba(251, 146, 60, 0.4)"
              strokeWidth="2"
            />
          ) : null}

          <path
            d={nominalPath}
            fill="none"
            stroke="rgba(34,197,94,0.55)"
            strokeWidth="5"
            strokeDasharray="12 10"
          />

          <path
            d={actualPath}
            fill="none"
            stroke="url(#actualStroke)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          <path
            d={predictedPath}
            fill="none"
            stroke="url(#predictedStroke)"
            strokeWidth="5"
            strokeDasharray="12 10"
            strokeLinecap="round"
            opacity="0.9"
          />

          {burnMarkers.map((window) => (
            <g key={window.id}>
              <circle
                cx={window.projected.x}
                cy={window.projected.y}
                r="10"
                fill="rgba(245, 158, 11, 0.15)"
                stroke="rgba(245, 158, 11, 0.9)"
                strokeWidth="3"
              />
              <text
                x={window.projected.x + 14}
                y={window.projected.y - 12}
                fill="#fcd34d"
                fontSize="18"
                fontFamily="sans-serif"
              >
                {window.label}
              </text>
            </g>
          ))}

          <image
            href="/images/earth.svg"
            x={earthPoint.x - 80}
            y={earthPoint.y - 80}
            width="160"
            height="160"
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/moon.svg"
            x={moonPoint.x - 55}
            y={moonPoint.y - 55}
            width="110"
            height="110"
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/orion.svg"
            x={currentPoint.x - 34}
            y={currentPoint.y - 34}
            width="68"
            height="68"
            preserveAspectRatio="xMidYMid meet"
          />

          <text
            x={earthPoint.x - 35}
            y={earthPoint.y + 105}
            fill="#93c5fd"
            fontSize="24"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            EARTH
          </text>

          <text
            x={moonPoint.x - 22}
            y={moonPoint.y + 82}
            fill="#e5e7eb"
            fontSize="20"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            MOON
          </text>

          <text
            x={currentPoint.x + 38}
            y={currentPoint.y + 6}
            fill="#facc15"
            fontSize="22"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            ORION
          </text>
        </svg>
      </div>
    </div>
  )
}