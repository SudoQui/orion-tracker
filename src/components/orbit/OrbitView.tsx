import type { TrajectoryPoint, Vector3 } from "@/types/trajectory"

type OrbitViewProps = {
  nominalTrajectory: TrajectoryPoint[]
  actualTrajectory: TrajectoryPoint[]
  moonPosition: Vector3
}

type Point2D = {
  x: number
  y: number
}

const VIEWBOX_SIZE = 1000
const CENTER = VIEWBOX_SIZE / 2
const SCALE = 0.00055

function projectPoint(position: Vector3): Point2D {
  return {
    x: CENTER + position.x * SCALE,
    y: CENTER - position.y * SCALE,
  }
}

function toSvgPath(points: TrajectoryPoint[]): string {
  if (points.length === 0) return ""

  return points
    .map((point, index) => {
      const projected = projectPoint(point.position)
      const command = index === 0 ? "M" : "L"
      return `${command} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`
    })
    .join(" ")
}

export default function OrbitView({
  nominalTrajectory,
  actualTrajectory,
  moonPosition,
}: OrbitViewProps) {
  const actualCurrent = actualTrajectory[actualTrajectory.length - 1]

  const earth = { x: CENTER, y: CENTER }
  const moon = projectPoint(moonPosition)
  const nominalPath = toSvgPath(nominalTrajectory)
  const actualPath = toSvgPath(actualTrajectory)
  const currentPoint = projectPoint(actualCurrent.position)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#020617]">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-lg font-semibold text-white">Trajectory View</h3>
        <p className="text-sm text-slate-400">
          Earth centered 2D mission view for MVP
        </p>
      </div>

      <div className="p-4">
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          className="h-[520px] w-full rounded-xl bg-[radial-gradient(circle_at_center,_rgba(30,41,59,0.8),_rgba(2,6,23,1))]"
        >
          <defs>
            <pattern
              id="starPattern"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="20" cy="25" r="1.2" fill="white" opacity="0.6" />
              <circle cx="60" cy="50" r="1.5" fill="white" opacity="0.5" />
              <circle cx="90" cy="15" r="1" fill="white" opacity="0.5" />
              <circle cx="35" cy="95" r="1.3" fill="white" opacity="0.4" />
              <circle cx="105" cy="80" r="1.1" fill="white" opacity="0.4" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#starPattern)" />

          <circle
            cx={earth.x}
            cy={earth.y}
            r="18"
            fill="#38bdf8"
            stroke="#7dd3fc"
            strokeWidth="4"
          />
          <text
            x={earth.x + 26}
            y={earth.y + 5}
            fill="#bae6fd"
            fontSize="24"
            fontFamily="sans-serif"
          >
            Earth
          </text>

          <circle
            cx={moon.x}
            cy={moon.y}
            r="10"
            fill="#e5e7eb"
            stroke="#f8fafc"
            strokeWidth="2"
          />
          <text
            x={moon.x + 18}
            y={moon.y + 5}
            fill="#e2e8f0"
            fontSize="20"
            fontFamily="sans-serif"
          >
            Moon
          </text>

          <path
            d={nominalPath}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4"
            strokeDasharray="10 8"
            opacity="0.8"
          />

          <path
            d={actualPath}
            fill="none"
            stroke="#22c55e"
            strokeWidth="5"
            opacity="0.9"
          />

          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="9"
            fill="#f97316"
            stroke="#fdba74"
            strokeWidth="3"
          />
          <text
            x={currentPoint.x + 16}
            y={currentPoint.y - 12}
            fill="#fed7aa"
            fontSize="18"
            fontFamily="sans-serif"
          >
            Orion
          </text>

          <g transform="translate(30, 30)">
            <rect
              x="0"
              y="0"
              width="280"
              height="95"
              rx="16"
              fill="rgba(15, 23, 42, 0.86)"
              stroke="rgba(255,255,255,0.12)"
            />
            <line
              x1="18"
              y1="24"
              x2="70"
              y2="24"
              stroke="#60a5fa"
              strokeWidth="4"
              strokeDasharray="8 6"
            />
            <text x="85" y="30" fill="#e2e8f0" fontSize="18">
              Nominal trajectory
            </text>

            <line
              x1="18"
              y1="50"
              x2="70"
              y2="50"
              stroke="#22c55e"
              strokeWidth="4"
            />
            <text x="85" y="56" fill="#e2e8f0" fontSize="18">
              Actual trajectory
            </text>

            <circle cx="44" cy="76" r="6" fill="#f97316" />
            <text x="85" y="82" fill="#e2e8f0" fontSize="18">
              Current spacecraft
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}