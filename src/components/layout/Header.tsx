type HeaderProps = {
  missionName: string
  vehicleName: string
  statusLabel: string
  updatedAt: string
}

export default function Header({
  missionName,
  vehicleName,
  statusLabel,
  updatedAt,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-6 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            OrionTracker
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{missionName}</h1>
          <p className="mt-1 text-slate-300">{vehicleName}</p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <span className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            {statusLabel}
          </span>
          <span className="text-sm text-slate-400">Updated: {updatedAt}</span>
        </div>
      </div>
    </header>
  )
}