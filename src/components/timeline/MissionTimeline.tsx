import type { MissionTimelineEvent } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type MissionTimelineProps = {
  events: MissionTimelineEvent[]
  currentTimestamp: string
}

export default function MissionTimeline({
  events,
  currentTimestamp,
}: MissionTimelineProps) {
  const currentMs = new Date(currentTimestamp).getTime()

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const eventMs = new Date(event.timestamp).getTime()
        const nextEventMs =
          index < events.length - 1
            ? new Date(events[index + 1].timestamp).getTime()
            : Number.POSITIVE_INFINITY

        const isComplete = currentMs > nextEventMs
        const isCurrent = currentMs >= eventMs && currentMs <= nextEventMs

        return (
          <div
            key={event.id}
            className={`rounded-2xl border p-4 transition ${
              isCurrent
                ? "border-cyan-400/20 bg-cyan-400/[0.05]"
                : isComplete
                  ? "border-white/10 bg-slate-900/60"
                  : "border-white/10 bg-slate-900/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex flex-col items-center">
                <span
                  className={`h-3.5 w-3.5 rounded-full ${
                    isCurrent
                      ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
                      : isComplete
                        ? "bg-emerald-300"
                        : "bg-slate-600"
                  }`}
                />
                {index < events.length - 1 ? (
                  <span className="mt-2 h-10 w-px bg-white/10" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {event.phase}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {event.label}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      isCurrent
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                        : isComplete
                          ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {isCurrent ? "Current" : isComplete ? "Complete" : "Upcoming"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-300">{event.description}</p>
                <p className="mt-3 text-sm text-slate-500">
                  {formatTimestamp(event.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}