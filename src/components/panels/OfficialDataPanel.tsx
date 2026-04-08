import type { ClosestApproachSummary } from "@/types/trajectory"
import type { SourceMetadata } from "@/types/mission"
import { formatKm, formatTimestamp } from "@/lib/formatting/format"

type OfficialDataPanelProps = {
  sourceMetadata?: SourceMetadata
  flownClosestApproachToMoon?: ClosestApproachSummary
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
  flownClosestApproachToMoon,
  futureSampleCount,
}: OfficialDataPanelProps) {
  if (!sourceMetadata) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
        Official source metadata is not available yet. The backend payload is still loading
        or the API response shape does not match the current UI.
      </div>
    )
  }

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
            Why the map looked wrong before
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            Time consistency fix
          </p>
        </div>

        <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-6 text-slate-400">
          Orion was shown as a path across many timestamps, while the Moon was shown only at
          its current position. That mixed a time history with a single instant. The map now
          also shows the Moon’s path over the same time windows and a semi transparent Moon at
          the historic closest approach location.
        </p>

        <Row
          label="Historic closest lunar approach"
          value={
            flownClosestApproachToMoon
              ? formatKm(flownClosestApproachToMoon.distanceKm)
              : "Unavailable"
          }
        />
        <Row
          label="Historic closest approach time"
          value={
            flownClosestApproachToMoon
              ? formatTimestamp(flownClosestApproachToMoon.timestamp)
              : "Unavailable"
          }
        />
        <Row label="Future samples shown" value={String(futureSampleCount)} />

        <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-6 text-slate-400">
          We also do not draw the full Orion mission unless it exists inside the currently
          available official ephemeris window. The display shows the official flown path up to
          now and the official future samples available from the published dataset.
        </p>
      </div>
    </div>
  )
}