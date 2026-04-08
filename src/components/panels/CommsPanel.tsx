import type { CommsStatus } from "@/types/trajectory"
import {
  formatDb,
  formatKbps,
  formatMbps,
  formatSeconds,
} from "@/lib/formatting/format"

type CommsPanelProps = {
  comms: CommsStatus
}

function CommsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

export default function CommsPanel({ comms }: CommsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Deep Space Network
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-white">{comms.station}</p>
            <p className="text-sm text-slate-400">Current handover lock</p>
          </div>
          <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            {comms.status}
          </span>
        </div>
      </div>

      <CommsRow label="Signal strength" value={formatDb(comms.signalStrengthDb)} />
      <CommsRow
        label="Round trip light time"
        value={formatSeconds(comms.roundTripLightTimeSeconds)}
      />
      <CommsRow label="Uplink bandwidth" value={formatKbps(comms.uplinkKbps)} />
      <CommsRow label="Downlink bandwidth" value={formatMbps(comms.downlinkMbps)} />
    </div>
  )
}