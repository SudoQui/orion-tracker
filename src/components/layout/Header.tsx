type HeaderProps = {
  missionName: string
  vehicleName: string
  statusLabel: string
  updatedAt: string
  linkedinUrl: string
  githubUrl: string
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.49 6A2.5 2.5 0 0 1 0 3.5 2.5 2.5 0 0 1 2.49 1a2.5 2.5 0 0 1 2.49 2.5ZM.5 8h4V23h-4V8Zm7 0h3.83v2.05h.05c.53-1 1.85-2.05 3.8-2.05 4.06 0 4.82 2.67 4.82 6.14V23h-4v-7.06c0-1.68-.03-3.84-2.34-3.84-2.35 0-2.71 1.83-2.71 3.72V23h-4V8Z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.66.5 12.03c0 5.1 3.3 9.43 7.88 10.96.58.11.79-.25.79-.56 0-.28-.01-1.2-.02-2.17-3.21.7-3.89-1.38-3.89-1.38-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.78 2.69 1.26 3.35.97.1-.75.4-1.26.73-1.55-2.56-.3-5.25-1.29-5.25-5.73 0-1.27.45-2.3 1.19-3.12-.12-.3-.51-1.5.11-3.12 0 0 .97-.31 3.18 1.19a11 11 0 0 1 5.8 0c2.21-1.5 3.17-1.19 3.17-1.19.63 1.62.24 2.82.12 3.12.74.82 1.18 1.85 1.18 3.12 0 4.45-2.69 5.43-5.26 5.72.41.36.78 1.08.78 2.18 0 1.58-.01 2.86-.01 3.25 0 .31.21.68.8.56A11.54 11.54 0 0 0 23.5 12.03C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  )
}

function ExternalPill({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/50 hover:bg-slate-900"
    >
      <span className="text-cyan-300">{icon}</span>
      <span>{label}</span>
    </a>
  )
}

export default function Header({
  missionName,
  vehicleName,
  statusLabel,
  updatedAt,
  linkedinUrl,
  githubUrl,
}: HeaderProps) {
  return (
    <header className="rounded-3xl border border-cyan-400/10 bg-slate-950/80 px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Sudo Tech logo"
            className="h-14 w-14 rounded-2xl border border-white/10 bg-slate-900/60 object-contain p-2 shadow-lg"
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
          />

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Powered by Sudo Tech
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              {missionName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{vehicleName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <ExternalPill
              href={linkedinUrl}
              label="Know more about me"
              icon={<LinkedInIcon />}
            />
            <ExternalPill
              href={githubUrl}
              label="GitHub Repo"
              icon={<GitHubIcon />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
              {statusLabel}
            </span>
            <span className="text-slate-400">Last refresh: {updatedAt}</span>
          </div>
        </div>
      </div>
    </header>
  )
}