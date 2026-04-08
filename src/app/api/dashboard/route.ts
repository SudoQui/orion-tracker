import { NextResponse } from "next/server"
import { getLiveDashboardData } from "@/lib/data/mission"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await getLiveDashboardData()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
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