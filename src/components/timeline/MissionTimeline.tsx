import type { MissionTimelineEvent } from "@/types/trajectory"
import { formatTimestamp } from "@/lib/formatting/format"

type MissionTimelineProps = {
  events: MissionTimelineEvent[]
  currentTimestamp: string
}

type EventState = "current" | "upcoming" | "completed"

function getCurrentIndex(events: MissionTimelineEvent[], currentMs: number): number {
  for (let i = 0; i < events.length; i += 1) {
    const start = new Date(events[i].timestamp).getTime()
    const next =
      i < events.length - 1
        ? new Date(events[i + 1].timestamp).getTime()
        : Number.POSITIVE_INFINITY

    if (currentMs >= start && currentMs < next) {
      return i
    }
  }

  if (currentMs < new Date(events[0].timestamp).getTime()) {
    return 0
  }

  return events.length - 1
}

export default function MissionTimeline({
  events,
  currentTimestamp,
}: MissionTimelineProps) {
  const currentMs = new Date(currentTimestamp).getTime()
  const currentIndex = getCurrentIndex(events, currentMs)

  const currentEvent = events[currentIndex]
  const upcoming = events.slice(currentIndex + 1)
  const completed = events.slice(0, currentIndex).reverse()

  const ordered = [currentEvent, ...upcoming, ...completed]

  const getState = (event: MissionTimelineEvent): EventState => {
    const originalIndex = events.findIndex((candidate) => candidate.id === event.id)

    if (originalIndex === currentIndex) return "current"
    if (originalIndex > currentIndex) return "upcoming"
    return "completed"
  }

  return (
    <div className="space-y-4">
      {ordered.map((event, orderedIndex) => {
        const state = getState(event)

        return (
          <div
            key={event.id}
            className={`rounded-2xl border p-4 transition ${
              state === "current"
                ? "border-cyan-400/25 bg-cyan-400/[0.06]"
                : state === "upcoming"
                  ? "border-white/10 bg-slate-900/50"
                  : "border-white/5 bg-slate-900/25 opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex flex-col items-center">
                <span
                  className={`h-3.5 w-3.5 rounded-full ${
                    state === "current"
                      ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
                      : state === "upcoming"
                        ? "bg-slate-400"
                        : "bg-slate-600"
                  }`}
                />
                {orderedIndex < ordered.length - 1 ? (
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
                      state === "current"
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                        : state === "upcoming"
                          ? "border-white/10 bg-white/5 text-slate-300"
                          : "border-white/5 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    {state === "current"
                      ? "Current"
                      : state === "upcoming"
                        ? "Upcoming"
                        : "Completed"}
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