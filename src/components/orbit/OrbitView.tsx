import type { TrajectoryPoint, Vector3 } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type OrbitViewProps = {
  actualTrajectory: TrajectoryPoint[]
  futureTrajectory: TrajectoryPoint[]
  currentMoonPosition: Vector3
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

export default function OrbitView({
  actualTrajectory,
  futureTrajectory,
  currentMoonPosition,
  currentTimestamp,
}: OrbitViewProps) {
  const allVectors = [
    ...actualTrajectory.map((point) => point.position),
    ...futureTrajectory.map((point) => point.position),
    currentMoonPosition,
    { x: 0, y: 0, z: 0 },
  ]

  const project = createProjector(allVectors)

  const actualPath = pathFromTrajectory(actualTrajectory, project)
  const futurePath = pathFromTrajectory(futureTrajectory, project)

  const earthPoint = project({ x: 0, y: 0, z: 0 })
  const moonPoint = project(currentMoonPosition)
  const currentPoint = project(
    actualTrajectory[actualTrajectory.length - 1].position
  )

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Mission map</h2>
          <p className="mt-1 text-sm text-slate-400">
            Official NASA trajectory with current JPL Moon position
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
            <linearGradient id="futureStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="#020617" />
          <rect width="100%" height="100%" fill="url(#stars)" />
          <rect width="100%" height="100%" fill="url(#largeGrid)" />

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