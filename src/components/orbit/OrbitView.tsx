import type { TrajectoryPoint, Vector3 } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type OrbitViewProps = {
  actualTrajectory: TrajectoryPoint[]
  futureTrajectory: TrajectoryPoint[]
  moonActualPath: TrajectoryPoint[]
  moonFuturePath: TrajectoryPoint[]
  currentMoonPosition: Vector3
  flownClosestApproachMoonPosition: Vector3
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

export default function OrbitView({
  actualTrajectory,
  futureTrajectory,
  moonActualPath,
  moonFuturePath,
  currentMoonPosition,
  flownClosestApproachMoonPosition,
  currentTimestamp,
}: OrbitViewProps) {
  const rotatedEarth = rotateClockwise90({ x: 0, y: 0, z: 0 })
  const rotatedCurrentMoon = rotateClockwise90(currentMoonPosition)
  const rotatedFlybyMoon = rotateClockwise90(flownClosestApproachMoonPosition)

  const rotatedVectors = [
    ...actualTrajectory.map((point) => rotateClockwise90(point.position)),
    ...futureTrajectory.map((point) => rotateClockwise90(point.position)),
    ...moonActualPath.map((point) => rotateClockwise90(point.position)),
    ...moonFuturePath.map((point) => rotateClockwise90(point.position)),
    rotatedCurrentMoon,
    rotatedFlybyMoon,
    rotatedEarth,
  ]

  const project = createProjector(rotatedVectors)

  const actualPath = pathFromTrajectory(actualTrajectory, project)
  const futurePath = pathFromTrajectory(futureTrajectory, project)
  const moonActualSvgPath = pathFromTrajectory(moonActualPath, project)
  const moonFutureSvgPath = pathFromTrajectory(moonFuturePath, project)

  const earthPoint = project(rotatedEarth)
  const moonPoint = project(rotatedCurrentMoon)
  const flybyMoonPoint = project(rotatedFlybyMoon)
  const currentPoint = project(
    rotateClockwise90(actualTrajectory[actualTrajectory.length - 1].position)
  )

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Mission map</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rotated for a wider layout, with Moon positions shown consistently through time
          </p>
        </div>

        <div className="text-sm text-slate-500">
          Current mission time: {formatTimestamp(currentTimestamp)}
        </div>
      </div>

      <div className="p-4">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-[760px] w-full rounded-2xl bg-[#030712]"
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
            x={earthPoint.x - 92}
            y={earthPoint.y - 92}
            width="184"
            height="184"
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/moon.svg"
            x={moonPoint.x - 62}
            y={moonPoint.y - 62}
            width="124"
            height="124"
            preserveAspectRatio="xMidYMid meet"
          />

          <image
            href="/images/moon.svg"
            x={flybyMoonPoint.x - 54}
            y={flybyMoonPoint.y - 54}
            width="108"
            height="108"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.38"
          />

          <image
            href="/images/orion.svg"
            x={currentPoint.x - 34}
            y={currentPoint.y - 34}
            width="68"
            height="68"
            preserveAspectRatio="xMidYMid meet"
          />

          <circle
            cx={flybyMoonPoint.x}
            cy={flybyMoonPoint.y}
            r="10"
            fill="rgba(229,231,235,0.08)"
            stroke="rgba(250,204,21,0.95)"
            strokeWidth="3"
          />

          <text
            x={flybyMoonPoint.x + 16}
            y={flybyMoonPoint.y - 14}
            fill="#facc15"
            fontSize="18"
            fontFamily="sans-serif"
            fontWeight="700"
          >
            Moon at closest approach
          </text>

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
            MOON NOW
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

          <g transform="translate(1010, 28)">
            <rect
              width="520"
              height="215"
              rx="22"
              fill="rgba(2, 6, 23, 0.78)"
              stroke="rgba(255,255,255,0.12)"
            />

            <line
              x1="22"
              y1="34"
              x2="88"
              y2="34"
              stroke="url(#actualStroke)"
              strokeWidth="6"
            />
            <text x="108" y="40" fill="#e2e8f0" fontSize="20">
              Orion flown path to current time
            </text>

            <line
              x1="22"
              y1="68"
              x2="88"
              y2="68"
              stroke="url(#futureStroke)"
              strokeWidth="5"
              strokeDasharray="10 8"
            />
            <text x="108" y="74" fill="#e2e8f0" fontSize="20">
              Orion future ephemeris
            </text>

            <line
              x1="22"
              y1="102"
              x2="88"
              y2="102"
              stroke="rgba(229,231,235,0.55)"
              strokeWidth="4"
            />
            <text x="108" y="108" fill="#e2e8f0" fontSize="20">
              Moon path over same time window
            </text>

            <circle cx="55" cy="138" r="7" fill="#facc15" />
            <text x="108" y="144" fill="#e2e8f0" fontSize="20">
              Current Orion position
            </text>

            <image
              href="/images/moon.svg"
              x="41"
              y="154"
              width="28"
              height="28"
              opacity="0.95"
            />
            <text x="108" y="176" fill="#e2e8f0" fontSize="20">
              Current Moon position
            </text>

            <image
              href="/images/moon.svg"
              x="41"
              y="182"
              width="28"
              height="28"
              opacity="0.38"
            />
            <text x="108" y="204" fill="#e2e8f0" fontSize="20">
              Moon at closest approach
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}