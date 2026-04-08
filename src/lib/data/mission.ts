import { readFile } from "fs/promises"
import path from "path"

import JSZip from "jszip"
import { unstable_cache } from "next/cache"

import type {
  DashboardData,
  MissionConfig,
  SourceMetadata,
} from "@/types/mission"
import type { TrajectoryPoint } from "@/types/trajectory"
import {
  buildPathUntilTime,
  buildTrajectorySamplesBetween,
  computeClosestApproachToMoon,
  computeMissionMetrics,
  getTimestampMs,
  interpolateTrajectoryAtTime,
} from "@/lib/math/trajectory"

const NASA_TRACKING_ARTICLE_URL =
  "https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/"
const NASA_BASE_URL = "https://www.nasa.gov"
const JPL_HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

const REFRESH_INTERVAL_SECONDS = 5
const SOURCE_REVALIDATE_SECONDS = 300
const PREDICTION_WINDOW_HOURS = 24

type ParsedEphemeris = {
  points: TrajectoryPoint[]
  metadata: Record<string, string>
  ephemerisZipUrl: string
}

async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", relativePath)
  const fileContents = await readFile(filePath, "utf-8")
  return JSON.parse(fileContents) as T
}

async function getMissionConfig(): Promise<MissionConfig> {
  return readJsonFile<MissionConfig>(path.join("data", "mission-config.json"))
}

function normalizeTimestamp(raw: string): string {
  return raw.endsWith("Z") ? raw : `${raw}Z`
}

function parseTrajectoryDataLine(line: string): TrajectoryPoint | null {
  const normalized = line.replaceAll(",", " ").trim()

  const isoMatch = normalized.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)$/
  )

  if (isoMatch) {
    const [, timestamp, x, y, z, vx, vy, vz] = isoMatch
    return {
      timestamp: normalizeTimestamp(timestamp),
      position: { x: Number(x), y: Number(y), z: Number(z) },
      velocity: { x: Number(vx), y: Number(vy), z: Number(vz) },
    }
  }

  const splitMatch = normalized.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)\s+([-+0-9.Ee]+)$/
  )

  if (splitMatch) {
    const [, datePart, timePart, x, y, z, vx, vy, vz] = splitMatch
    return {
      timestamp: normalizeTimestamp(`${datePart}T${timePart}`),
      position: { x: Number(x), y: Number(y), z: Number(z) },
      velocity: { x: Number(vx), y: Number(vy), z: Number(vz) },
    }
  }

  return null
}

function parseEphemerisText(text: string): {
  points: TrajectoryPoint[]
  metadata: Record<string, string>
} {
  const points: TrajectoryPoint[] = []
  const metadata: Record<string, string> = {}

  let inMetaBlock = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (line === "META_START") {
      inMetaBlock = true
      continue
    }

    if (line === "META_STOP") {
      inMetaBlock = false
      continue
    }

    if (inMetaBlock && line.includes("=")) {
      const [key, ...rest] = line.split("=")
      metadata[key.trim()] = rest.join("=").trim()
      continue
    }

    if (line.startsWith("COMMENT")) continue
    if (line.startsWith("COVARIANCE")) break

    const point = parseTrajectoryDataLine(line)
    if (point) points.push(point)
  }

  return {
    points: points.sort(
      (a, b) => getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp)
    ),
    metadata,
  }
}

function extractLatestEphemerisZipUrl(articleHtml: string): string {
  const absoluteMatches = Array.from(
    articleHtml.matchAll(
      /https:\/\/www\.nasa\.gov\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'<> ]*artemis-ii[^"'<> ]*\.zip/gi
    ),
    (match) => match[0]
  )

  const relativeMatches = Array.from(
    articleHtml.matchAll(
      /\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'<> ]*artemis-ii[^"'<> ]*\.zip/gi
    ),
    (match) => `${NASA_BASE_URL}${match[0]}`
  )

  const urls = [...new Set([...absoluteMatches, ...relativeMatches])].sort(
    (a, b) => a.localeCompare(b)
  )

  const latest = urls[urls.length - 1]

  if (!latest) {
    throw new Error("Could not find the Artemis II ephemeris ZIP on the NASA tracking page.")
  }

  return latest
}

async function fetchLatestEphemerisZipUrl(): Promise<string> {
  const response = await fetch(NASA_TRACKING_ARTICLE_URL, {
    next: { revalidate: SOURCE_REVALIDATE_SECONDS },
    headers: { Accept: "text/html,application/xhtml+xml" },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch NASA tracking page: ${response.status}`)
  }

  const html = await response.text()
  return extractLatestEphemerisZipUrl(html)
}

async function fetchAndParseNasaEphemeris(): Promise<ParsedEphemeris> {
  const ephemerisZipUrl = await fetchLatestEphemerisZipUrl()

  const response = await fetch(ephemerisZipUrl, {
    next: { revalidate: SOURCE_REVALIDATE_SECONDS },
    headers: { Accept: "application/zip,*/*" },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch NASA ephemeris ZIP: ${response.status}`)
  }

  const zipBuffer = await response.arrayBuffer()
  const zip = await JSZip.loadAsync(zipBuffer)

  let best: ParsedEphemeris | null = null

  for (const file of Object.values(zip.files)) {
    if (file.dir) continue
    if (!/\.(oem|txt|asc|ephem|eph|csv)$/i.test(file.name)) continue

    const text = await file.async("text")
    const parsed = parseEphemerisText(text)

    if (parsed.points.length > 0 && (!best || parsed.points.length > best.points.length)) {
      best = {
        points: parsed.points,
        metadata: parsed.metadata,
        ephemerisZipUrl,
      }
    }
  }

  if (!best) {
    throw new Error("No parseable trajectory file was found inside the NASA ephemeris ZIP.")
  }

  return best
}

function buildHorizonsCalendarValue(timestamp: string): string {
  return timestamp.replace("T", " ").replace(/Z$/, "")
}

function buildMoonVectorsUrl(
  startTime: string,
  stopTime: string,
  stepSize: string,
  timeSystem: string
): string {
  const params = new URLSearchParams()

  params.set("format", "json")
  params.set("COMMAND", "'301'")
  params.set("OBJ_DATA", "NO")
  params.set("MAKE_EPHEM", "YES")
  params.set("EPHEM_TYPE", "VECTORS")
  params.set("CENTER", "'500@399'")
  params.set("REF_SYSTEM", "'ICRF'")
  params.set("REF_PLANE", "'FRAME'")
  params.set("OUT_UNITS", "'KM-S'")
  params.set("VEC_TABLE", "'2'")
  params.set("VEC_CORR", "'NONE'")
  params.set("CSV_FORMAT", "'YES'")
  params.set("TIME_TYPE", `'${timeSystem}'`)
  params.set("START_TIME", `'${buildHorizonsCalendarValue(startTime)}'`)
  params.set("STOP_TIME", `'${buildHorizonsCalendarValue(stopTime)}'`)
  params.set("STEP_SIZE", `'${stepSize}'`)

  return `${JPL_HORIZONS_API_URL}?${params.toString()}`
}

function extractLinesBetweenMarkers(result: string): string[] {
  const startMarker = "$$SOE"
  const endMarker = "$$EOE"

  const startIndex = result.indexOf(startMarker)
  const endIndex = result.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Could not parse Horizons vector output.")
  }

  return result
    .slice(startIndex + startMarker.length, endIndex)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

async function fetchMoonTrajectoryForRange(
  startTime: string,
  stopTime: string,
  timeSystem: string
): Promise<TrajectoryPoint[]> {
  const url = buildMoonVectorsUrl(
    startTime,
    stopTime,
    "30 m",
    timeSystem === "TDB" ? "TDB" : "UT"
  )

  const response = await fetch(url, {
    next: { revalidate: SOURCE_REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch JPL Horizons Moon vectors: ${response.status}`)
  }

  const data = (await response.json()) as {
    result?: string
    error?: string
  }

  if (data.error) {
    throw new Error(`JPL Horizons error: ${data.error}`)
  }

  if (!data.result) {
    throw new Error("JPL Horizons returned no result field.")
  }

  const lines = extractLinesBetweenMarkers(data.result)
  const points: TrajectoryPoint[] = []

  for (const line of lines) {
    const values = line
      .split(",")
      .map((part) => part.trim())

    if (values.length < 8) continue

    const calendar = values[1]
    const timestamp = normalizeTimestamp(calendar.replace(" ", "T"))
    const numericValues = values
      .slice(2)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))

    if (numericValues.length < 6) continue

    const [x, y, z, vx, vy, vz] = numericValues.slice(0, 6)

    points.push({
      timestamp,
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
    })
  }

  if (points.length === 0) {
    throw new Error("No Moon vectors were parsed from JPL Horizons.")
  }

  return points.sort(
    (a, b) => getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp)
  )
}

function getValidatedSourceMetadata(parsed: ParsedEphemeris): SourceMetadata {
  const centerName =
    parsed.metadata.CENTER_NAME ??
    parsed.metadata.CENTER ??
    "Earth"

  const referenceFrame =
    parsed.metadata.REF_FRAME ??
    parsed.metadata.REF_SYSTEM ??
    "ICRF"

  const timeSystem =
    (parsed.metadata.TIME_SYSTEM ?? "UT").toUpperCase()

  if (!/EARTH|GEOCENTRIC|399/i.test(centerName)) {
    throw new Error(
      `Unsupported ephemeris center '${centerName}'. This build expects an Earth centered trajectory.`
    )
  }

  return {
    trajectorySourceLabel: "NASA Artemis Real-Time Orbit Website ephemeris",
    trajectorySourceUrl: NASA_TRACKING_ARTICLE_URL,
    ephemerisZipUrl: parsed.ephemerisZipUrl,
    moonSourceLabel: "JPL Horizons Moon vectors",
    moonSourceUrl: JPL_HORIZONS_API_URL,
    referenceFrame,
    centerName,
    timeSystem,
    officialSampleCount: parsed.points.length,
    officialEphemerisEndTime: parsed.points[parsed.points.length - 1].timestamp,
  }
}

const getCachedOfficialVectorBundle = unstable_cache(
  async () => {
    const parsed = await fetchAndParseNasaEphemeris()
    const sourceMetadata = getValidatedSourceMetadata(parsed)

    const startTime = parsed.points[0].timestamp
    const stopTime = parsed.points[parsed.points.length - 1].timestamp

    const moonTrajectory = await fetchMoonTrajectoryForRange(
      startTime,
      stopTime,
      sourceMetadata.timeSystem
    )

    return {
      spacecraftTrajectory: parsed.points,
      moonTrajectory,
      sourceMetadata,
    }
  },
  ["official-artemis-ii-vector-bundle"],
  { revalidate: SOURCE_REVALIDATE_SECONDS }
)

export async function getLiveDashboardData(): Promise<DashboardData> {
  const [config, vectorBundle] = await Promise.all([
    getMissionConfig(),
    getCachedOfficialVectorBundle(),
  ])

  const { spacecraftTrajectory, moonTrajectory, sourceMetadata } = vectorBundle

  if (spacecraftTrajectory.length === 0 || moonTrajectory.length === 0) {
    throw new Error("Official trajectory data is empty.")
  }

  const startMs = getTimestampMs(spacecraftTrajectory[0].timestamp)
  const endMs = getTimestampMs(
    spacecraftTrajectory[spacecraftTrajectory.length - 1].timestamp
  )
  const nowMs = Date.now()
  const clampedNowMs = Math.min(Math.max(nowMs, startMs), endMs)

  const currentActualPoint = interpolateTrajectoryAtTime(
    spacecraftTrajectory,
    clampedNowMs
  )

  const currentMoonPoint = interpolateTrajectoryAtTime(
    moonTrajectory,
    clampedNowMs
  ).position

  const actualPath = buildPathUntilTime(spacecraftTrajectory, clampedNowMs)

  const predictionEndMs = Math.min(
    clampedNowMs + PREDICTION_WINDOW_HOURS * 60 * 60 * 1000,
    endMs
  )

  const futurePath = buildTrajectorySamplesBetween(
    spacecraftTrajectory,
    clampedNowMs,
    predictionEndMs,
    30 * 60 * 1000
  )

  const latestMetrics = computeMissionMetrics({
    point: currentActualPoint,
    allActualPoints: actualPath,
    currentMoonPoint,
    launchTime: config.launchTime,
    missionEndTime: spacecraftTrajectory[spacecraftTrajectory.length - 1].timestamp,
    timeline: config.timeline,
  })

  const nextClosestApproachToMoon = computeClosestApproachToMoon(
    futurePath,
    moonTrajectory
  )

  return {
    config,
    actualPath,
    futurePath,
    currentActualPoint,
    currentMoonPoint,
    latestMetrics,
    nextClosestApproachToMoon,
    sourceMetadata,
    lastUpdated: new Date().toISOString(),
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS,
  }
}