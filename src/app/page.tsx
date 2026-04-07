import Header from "@/components/layout/Header"
import SectionCard from "@/components/layout/SectionCard"
import MissionStats from "@/components/metrics/MissionStats"
import OrbitView from "@/components/orbit/OrbitView"
import MissionTimeline from "@/components/timeline/MissionTimeline"
import { getMissionDashboardData } from "@/lib/data/mission"
import { formatTimestamp } from "@/lib/formatting/format"

export default async function HomePage() {
  const { config, nominalTrajectory, actualTrajectory, latestMetrics } =
    await getMissionDashboardData()

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Header
          missionName={config.missionName}
          vehicleName={config.vehicleName}
          statusLabel="MVP Demo Data Loaded"
          updatedAt={formatTimestamp(latestMetrics.timestamp)}
        />

        <div className="mt-8 grid gap-8">
          <SectionCard
            title="Mission Overview"
            subtitle="Earth, Moon, nominal trajectory, actual trajectory, and current spacecraft position"
          >
            <OrbitView
              nominalTrajectory={nominalTrajectory}
              actualTrajectory={actualTrajectory}
              moonPosition={config.moonReferencePosition}
            />
          </SectionCard>

          <SectionCard
            title="Mission Metrics"
            subtitle="Derived from trajectory samples and mission timestamps"
          >
            <MissionStats metrics={latestMetrics} />
          </SectionCard>

          <SectionCard
            title="Mission Timeline"
            subtitle="Major mission events for the Artemis II lunar flyby profile"
          >
            <MissionTimeline events={config.timeline} />
          </SectionCard>

          <SectionCard
            title="Engineering Notes"
            subtitle="What this MVP demonstrates"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <h3 className="text-lg font-semibold text-white">Data Flow</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The dashboard loads nominal and actual trajectory datasets,
                  normalizes them into a shared internal structure, computes
                  derived metrics, and renders the results into a mission
                  tracking interface.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <h3 className="text-lg font-semibold text-white">
                  Engineering Focus
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The goal is to demonstrate vector math, distance
                  calculations, mission progress logic, trajectory comparison,
                  technical documentation, and a clean production style
                  frontend structure.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  )
}