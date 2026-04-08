export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value)
}

export function formatKm(value: number): string {
  return `${formatNumber(value, 0)} km`
}

export function formatKmPerSec(value: number): string {
  return `${formatNumber(value, 2)} km/s`
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))

  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)

  return parts.join(" ")
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function formatDb(value: number): string {
  return `${formatNumber(value, 1)} dB`
}

export function formatSeconds(value: number): string {
  return `${formatNumber(value, 2)} s`
}

export function formatKbps(value: number): string {
  return `${formatNumber(value, 1)} kbps`
}

export function formatMbps(value: number): string {
  return `${formatNumber(value, 2)} Mbps`
}