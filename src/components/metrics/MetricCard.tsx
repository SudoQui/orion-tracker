type MetricCardProps = {
  label: string
  value: string
  helper?: string
}

export default function MetricCard({
  label,
  value,
  helper,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  )
}