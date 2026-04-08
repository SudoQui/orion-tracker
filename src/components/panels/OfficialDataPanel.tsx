import type { ClosestApproachSummary } from "@/types/trajectory"
import type { SourceMetadata } from "@/types/mission"
import { formatKm, formatTimestamp } from "@/lib/formatting/format"

type OfficialDataPanelProps = {
  sourceMetadata: SourceMetadata
  nextClosestApproachToMoon: ClosestApproachSummary
  futureSampleCount: number
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

export default function OfficialDataPanel({
  sourceMetadata,
  nextClosestApproachToMoon,
  futureSampleCount,
}: OfficialDataPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Official sources
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            NASA and JPL vector data
          </p>
        </div>

        <Row label="Reference frame" value={sourceMetadata.referenceFrame} />
        <Row label="Center" value={sourceMetadata.centerName} />
        <Row label="Time system" value={sourceMetadata.timeSystem} />
        <Row
          label="Official sample count"
          value={String(sourceMetadata.officialSampleCount)}
        />
        <Row
          label="Ephemeris end"
          value={formatTimestamp(sourceMetadata.officialEphemerisEndTime)}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={sourceMetadata.trajectorySourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-300/50"
          >
            NASA AROW source
          </a>

          <a
            href={sourceMetadata.ephemerisZipUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-300/50"
          >
            Artemis II ephemeris ZIP
          </a>

          <a
            href={sourceMetadata.moonSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-300/50"
          >
            JPL Horizons
          </a>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Official future outlook
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            From the current official ephemeris
          </p>
        </div>

        <Row label="Future samples shown" value={String(futureSampleCount)} />
        <Row
          label="Next closest lunar approach"
          value={formatKm(nextClosestApproachToMoon.distanceKm)}
        />
        <Row
          label="Approach time"
          value={formatTimestamp(nextClosestApproachToMoon.timestamp)}
        />

        <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-6 text-slate-400">
          This panel only shows values derived from official vector datasets. No simulated
          comms, nominal overlays, or guessed burn windows are included in this accuracy
          mode.
        </p>
      </div>
    </div>
  )
}