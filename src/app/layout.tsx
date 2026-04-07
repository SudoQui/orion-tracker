import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OrionTracker",
  description:
    "A dashboard for visualizing Artemis II trajectory, mission progress, and engineering metrics.",
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