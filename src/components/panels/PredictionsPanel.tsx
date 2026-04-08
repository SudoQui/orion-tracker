import type {
  BurnWindow,
  ClosestApproachPrediction,
  ReentryCorridor,
  TrajectoryPoint,
} from "@/types/trajectory"
import { formatKm, formatTimestamp } from "@/lib/formatting/format"

type PredictionsPanelProps = {
  predictedPath: TrajectoryPoint[]
  burnWindows: BurnWindow[]
  nextClosestApproach: ClosestApproachPrediction
  reentryCorridor: ReentryCorridor
}

function BurnBadge({ status }: { status: BurnWindow["status"] }) {
  const styles = {
    Completed: "border-white/10 bg-white/5 text-slate-300",
    Active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    Upcoming: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function PredictionsPanel({
  predictedPath,
  burnWindows,
  nextClosestApproach,
  reentryCorridor,
}: PredictionsPanelProps) {
  const nextBurn =
    burnWindows.find((window) => window.status === "Active") ??
    burnWindows.find((window) => window.status === "Upcoming") ??
    burnWindows[0]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Predicted next 24 hours
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {Math.max(predictedPath.length - 1, 0)} future samples
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Dashed forecast path generated from the reference route
        </p>
      </div>

      {nextBurn ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Burn window
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{nextBurn.label}</p>
            </div>
            <BurnBadge status={nextBurn.status} />
          </div>

          <p className="mt-2 text-sm text-slate-300">{nextBurn.objective}</p>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <p>Start: {formatTimestamp(nextBurn.startTime)}</p>
            <p>End: {formatTimestamp(nextBurn.endTime)}</p>
            <p>Estimated delta-v: {nextBurn.deltaVms.toFixed(0)} m/s</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Closest approach forecast
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {nextClosestApproach.target}
        </p>
        <div className="mt-3 space-y-2 text-sm text-slate-400">
          <p>Time: {formatTimestamp(nextClosestApproach.timestamp)}</p>
          <p>Distance: {formatKm(nextClosestApproach.distanceKm)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Re-entry corridor
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {reentryCorridor.visible ? "Visualized on mission map" : "Unavailable"}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          A shaded approach funnel is rendered near Earth to give the display a mission
          planning plus mission monitoring feel.
        </p>
      </div>
    </div>
  )
}