import MetricCard from "./MetricCard"
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

export default function MissionStats({ metrics }: MissionStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        label="Mission Phase"
        value={metrics.missionPhase}
        helper="Current interpreted phase"
      />
      <MetricCard
        label="Speed"
        value={formatKmPerSec(metrics.speedKmPerSec)}
        helper="Derived from velocity vector"
      />
      <MetricCard
        label="Distance from Earth"
        value={formatKm(metrics.distanceFromEarthKm)}
        helper="Earth centered reference"
      />
      <MetricCard
        label="Distance from Moon"
        value={formatKm(metrics.distanceFromMoonKm)}
        helper="Using reference Moon position"
      />
      <MetricCard
        label="Cumulative Distance"
        value={formatKm(metrics.cumulativeDistanceKm)}
        helper="Sum of traveled path segments"
      />
      <MetricCard
        label="Mission Progress"
        value={formatPercent(metrics.progressPercent)}
        helper="Elapsed divided by planned duration"
      />
      <MetricCard
        label="Elapsed Time"
        value={formatDuration(metrics.elapsedSeconds)}
        helper="Since launch timestamp"
      />
      <MetricCard
        label="Time Remaining"
        value={formatDuration(metrics.remainingSeconds)}
        helper="Relative to planned end"
      />
      <MetricCard
        label="Deviation from Nominal"
        value={formatKm(metrics.deviationFromNominalKm)}
        helper="Nearest timestamp comparison"
      />
    </div>
  )
}