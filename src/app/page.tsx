"use client"

import { useEffect, useState } from "react"

import Header from "@/components/layout/Header"
import SectionCard from "@/components/layout/SectionCard"
import MissionStats from "@/components/metrics/MissionStats"
import OrbitView from "@/components/orbit/OrbitView"
import CommsPanel from "@/components/panels/CommsPanel"
import PredictionsPanel from "@/components/panels/PredictionsPanel"
import MissionTimeline from "@/components/timeline/MissionTimeline"
import { formatTimestamp } from "@/lib/formatting/format"
import type { DashboardData } from "@/types/mission"

const LINKEDIN_URL = "https://www.linkedin.com/in/your-linkedin"
const GITHUB_URL = "https://github.com/your-username/orion-tracker"

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
          <p className="mt-4 text-lg font-medium">Booting OrionTracker mission console...</p>
          <p className="mt-2 text-sm text-slate-400">
            Pulling trajectory, mission, and communication data
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1850px] px-4 py-5 md:px-6 lg:px-8">
        <Header
          missionName={data.config.missionName}
          vehicleName={data.config.vehicleName}
          statusLabel={`Auto-refresh every ${data.refreshIntervalSeconds}s`}
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
          <div className="space-y-6">
            <SectionCard
              title="Mission metrics"
              subtitle="Live derived engineering values"
            >
              <MissionStats metrics={data.latestMetrics} />
            </SectionCard>

            <SectionCard
              title="Communications"
              subtitle="Deep Space Network contact snapshot"
            >
              <CommsPanel comms={data.comms} />
            </SectionCard>

            <SectionCard
              title="Planning and prediction"
              subtitle="Forecast overlays and mission planning cues"
            >
              <PredictionsPanel
                predictedPath={data.predictedPath}
                burnWindows={data.burnWindows}
                nextClosestApproach={data.nextClosestApproach}
                reentryCorridor={data.reentryCorridor}
              />
            </SectionCard>
          </div>

          <OrbitView
            nominalTrajectory={data.nominalPath}
            actualTrajectory={data.actualPath}
            predictedTrajectory={data.predictedPath}
            moonPosition={data.config.moonReferencePosition}
            burnWindows={data.burnWindows}
            reentryCorridor={data.reentryCorridor}
            currentTimestamp={data.currentActualPoint.timestamp}
          />

          <SectionCard
            title="Mission timeline"
            subtitle="Event progression across the Artemis II profile"
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