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
  accent = "cyan",
}: {
  label: string
  value: string
  helper: string
  accent?: "cyan" | "emerald" | "amber"
}) {
  const accentMap = {
    cyan: "border-cyan-400/15 bg-cyan-400/[0.04]",
    emerald: "border-emerald-400/15 bg-emerald-400/[0.04]",
    amber: "border-amber-400/15 bg-amber-400/[0.04]",
  }

  return (
    <div className={`rounded-2xl border p-4 ${accentMap[accent]}`}>
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
        helper="Derived from the current velocity vector"
        accent="emerald"
      />

      <StatCard
        label="Distance from Earth"
        value={formatKm(metrics.distanceFromEarthKm)}
        helper="Earth centered reference frame"
      />

      <StatCard
        label="Distance from Moon"
        value={formatKm(metrics.distanceFromMoonKm)}
        helper="Using the mission Moon reference vector"
      />

      <StatCard
        label="Distance traveled"
        value={formatKm(metrics.cumulativeDistanceKm)}
        helper="Cumulative length of the tracked path"
      />

      <StatCard
        label="Elapsed time"
        value={formatDuration(metrics.elapsedSeconds)}
        helper="Time since the mission launch timestamp"
      />

      <StatCard
        label="Time remaining"
        value={formatDuration(metrics.remainingSeconds)}
        helper="Based on the planned mission end"
      />

      <StatCard
        label="Off nominal"
        value={formatKm(metrics.deviationFromNominalKm)}
        helper="Nearest time comparison against the reference trajectory"
        accent="amber"
      />
    </div>
  )
}