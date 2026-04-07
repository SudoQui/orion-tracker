import { ReactNode } from "react"

type SectionCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function SectionCard({
  title,
  subtitle,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}