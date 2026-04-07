import type { MissionTimelineEvent } from "./trajectory"

export type MissionConfig = {
  missionName: string
  vehicleName: string
  launchTime: string
  plannedEndTime: string
  earthRadiusKm: number
  moonRadiusKm: number
  moonReferencePosition: {
    x: number
    y: number
    z: number
  }
  timeline: MissionTimelineEvent[]
}