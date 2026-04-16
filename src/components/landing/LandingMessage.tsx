export default function StrobingMessage() {
  return (
    <div className="rounded-2xl border border-emerald-400/45 bg-emerald-950/55 px-4 py-4 text-center shadow-lg shadow-emerald-400/10 sm:px-5">
      <style>{`
        @keyframes timelineStrobe {
          0% { opacity: 0.76; filter: drop-shadow(0 0 0 rgba(52,211,153,0)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(52,211,153,0.5)); }
          100% { opacity: 0.76; filter: drop-shadow(0 0 0 rgba(52,211,153,0)); }
        }
        .timeline-strobe {
          animation: timelineStrobe 2.1s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-1.5">
        <h3 className="timeline-strobe text-sm font-bold tracking-[0.06em] text-emerald-300 sm:text-base sm:tracking-[0.08em]">
          {"\u{1F6EC} Orion team have made it home \u{1F30D}"}
        </h3>
        <p className="timeline-strobe text-[11px] leading-relaxed text-emerald-200/95 sm:text-xs">
          {"\u{1F64F} Thank you everyone for tracking with us."}
        </p>
        <p className="timeline-strobe text-[11px] leading-relaxed text-emerald-200/90 sm:text-xs">
          {"\u{1F680} See you next mission."}
        </p>
      </div>
    </div>
  )
}
