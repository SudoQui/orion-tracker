import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OrionTracker | Artemis II Mission Console",
  description:
    "A mission monitoring dashboard for Artemis II featuring live trajectory, comms, prediction overlays, and engineering metrics.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}