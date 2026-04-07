import type { MissionTimelineEvent } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type MissionTimelineProps = {
  events: MissionTimelineEvent[]
}

export default function MissionTimeline({ events }: MissionTimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-cyan-300">{event.phase}</p>
              <h3 className="text-lg font-semibold text-white">{event.label}</h3>
            </div>
            <p className="text-sm text-slate-400">
              {formatTimestamp(event.timestamp)}
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-300">{event.description}</p>
        </div>
      ))}
    </div>
  )
}