"use client"

import { useEffect, useState } from "react"

import Header from "@/components/layout/Header"
import SectionCard from "@/components/layout/SectionCard"
import MissionStats from "@/components/metrics/MissionStats"
import OrbitView from "@/components/orbit/OrbitView"
import OfficialDataPanel from "@/components/panels/OfficialDataPanel"
import MissionTimeline from "@/components/timeline/MissionTimeline"
import { formatTimestamp } from "@/lib/formatting/format"
import type { DashboardData, SourceMetadata } from "@/types/mission"

const LINKEDIN_URL = "https://www.linkedin.com/in/mustafa-siddiqui-32ab73161/"
const GITHUB_URL = "https://github.com/SudoQui/orion-tracker"

function buildFallbackSourceMetadata(data: DashboardData | null): SourceMetadata {
  const fallbackTimestamp =
    data?.currentActualPoint?.timestamp ??
    data?.lastUpdated ??
    new Date().toISOString()

  return {
    trajectorySourceLabel: "NASA Artemis Real-Time Orbit Website ephemeris",
    trajectorySourceUrl:
      "https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/",
    ephemerisZipUrl: "",
    moonSourceLabel: "JPL Horizons Moon vectors",
    moonSourceUrl: "https://ssd.jpl.nasa.gov/api/horizons.api",
    referenceFrame: "ICRF",
    centerName: "Earth",
    timeSystem: "UT",
    officialSampleCount: data?.actualPath?.length ?? 0,
    officialEphemerisEndTime: fallbackTimestamp,
  }
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to load dashboard data.")
        }

        const payload = (await response.json()) as DashboardData

        if (isMounted) {
          setData(payload)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unexpected dashboard error."
          )
        }
      }
    }

    void loadData()
    const interval = window.setInterval(loadData, 5000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-8 py-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-300" />
          <p className="mt-4 text-lg font-medium">
            Booting OrionTracker accuracy mode...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Pulling official NASA and JPL vectors
          </p>
        </div>
      </main>
    )
  }

  const safeSourceMetadata = data.sourceMetadata ?? buildFallbackSourceMetadata(data)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1850px] px-4 py-5 md:px-6 lg:px-8">
        <Header
          missionName={data.config.missionName}
          vehicleName={data.config.vehicleName}
          statusLabel={`Official NASA/JPL data · UI refresh ${data.refreshIntervalSeconds}s`}
          updatedAt={formatTimestamp(data.lastUpdated)}
          linkedinUrl={LINKEDIN_URL}
          githubUrl={GITHUB_URL}
        />

        {error ? (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <SectionCard
            title="Mission metrics"
            subtitle="Only official or officially-derived values"
            className="h-fit"
          >
            <MissionStats metrics={data.latestMetrics} />
          </SectionCard>

          <div className="space-y-6">
            <OrbitView
              actualTrajectory={data.actualPath}
              futureTrajectory={data.futurePath}
              moonActualPath={data.moonActualPath}
              moonFuturePath={data.moonFuturePath}
              currentMoonPosition={data.currentMoonPoint}
              flownClosestApproachMoonPosition={data.flownClosestApproachMoonPoint}
              currentTimestamp={data.currentActualPoint.timestamp}
            />

            <SectionCard
              title="Official data status"
              subtitle="Source provenance and time-consistent interpretation"
            >
              <OfficialDataPanel
                sourceMetadata={safeSourceMetadata}
                flownClosestApproachToMoon={data.flownClosestApproachToMoon}
                futureSampleCount={data.futurePath.length}
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Mission timeline"
            subtitle="Current event pinned to the top"
            className="h-fit"
          >
            <MissionTimeline
              events={data.config.timeline}
              currentTimestamp={data.currentActualPoint.timestamp}
            />
          </SectionCard>
        </div>
      </div>
    </main>
  )
}