import type { MissionMetrics } from "@/types/trajectory"
import {
  formatDuration,
  formatKm,
  formatKmPerSec,
  formatPercent,
} from "@/lib/formatting/format"

type MissionStatsProps = {
  metrics: MissionMetrics
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export default function MissionStats({ metrics }: MissionStatsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Mission progress</p>
          <p className="text-lg font-semibold text-cyan-300">
            {formatPercent(metrics.progressPercent)}
          </p>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 transition-all duration-700"
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Current phase
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {metrics.missionPhase}
          </p>
        </div>
      </div>

      <StatCard
        label="Speed"
        value={formatKmPerSec(metrics.speedKmPerSec)}
        helper="Official current velocity magnitude"
      />

      <StatCard
        label="Distance from Earth"
        value={formatKm(metrics.distanceFromEarthKm)}
        helper="From official Earth centered trajectory vectors"
      />

      <StatCard
        label="Distance from Moon"
        value={formatKm(metrics.distanceFromMoonKm)}
        helper="Computed using official JPL Moon vectors"
      />

      <StatCard
        label="Distance traveled"
        value={formatKm(metrics.cumulativeDistanceKm)}
        helper="Cumulative length of the flown path to now"
      />

      <StatCard
        label="Elapsed time"
        value={formatDuration(metrics.elapsedSeconds)}
        helper="Measured from official launch time"
      />

      <StatCard
        label="Time remaining"
        value={formatDuration(metrics.remainingSeconds)}
        helper="Based on the latest official ephemeris endpoint"
      />
    </div>
  )
}