import { NextResponse } from "next/server"
import { getLiveDashboardData } from "@/lib/data/mission"
import type { DashboardData, SourceMetadata } from "@/types/mission"

export const dynamic = "force-dynamic"
export const revalidate = 0

function buildFallbackSourceMetadata(
  data: Partial<DashboardData>
): SourceMetadata {
  const fallbackTimestamp =
    data.currentActualPoint?.timestamp ??
    data.lastUpdated ??
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
    officialSampleCount: data.actualPath?.length ?? 0,
    officialEphemerisEndTime: fallbackTimestamp,
  }
}

function normalizeDashboardData(data: Partial<DashboardData>): DashboardData {
  const fallbackTimestamp =
    data.currentActualPoint?.timestamp ??
    data.lastUpdated ??
    new Date().toISOString()

  return {
    config: data.config!,
    actualPath: data.actualPath ?? [],
    futurePath: data.futurePath ?? [],
    moonActualPath: data.moonActualPath ?? [],
    moonFuturePath: data.moonFuturePath ?? [],
    currentActualPoint:
      data.currentActualPoint ?? {
        timestamp: fallbackTimestamp,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      },
    currentMoonPoint: data.currentMoonPoint ?? { x: 0, y: 0, z: 0 },
    flownClosestApproachToMoon:
      data.flownClosestApproachToMoon ?? {
        timestamp: fallbackTimestamp,
        distanceKm: 0,
      },
    flownClosestApproachMoonPoint:
      data.flownClosestApproachMoonPoint ?? { x: 0, y: 0, z: 0 },
    latestMetrics: data.latestMetrics!,
    sourceMetadata:
      data.sourceMetadata ?? buildFallbackSourceMetadata(data),
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
    refreshIntervalSeconds: data.refreshIntervalSeconds ?? 5,
  }
}

export async function GET() {
  try {
    const rawData = (await getLiveDashboardData()) as Partial<DashboardData>
    const normalizedData = normalizeDashboardData(rawData)

    return NextResponse.json(normalizedData, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to build official dashboard payload.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}