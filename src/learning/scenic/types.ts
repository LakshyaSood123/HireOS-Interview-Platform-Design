// Scenic-world data model — deliberately separate from the learning-engine
// types (src/learning/types.ts). A zone's SCENIC representation (where its
// landmarks sit, what kind of landmark each one is, how zones connect) is
// presentation data, not progression data — the engine never needs to know
// a module is drawn as a "watchtower" at (68%, 38%). See
// LEARNING_ENGINE_ARCHITECTURE.md's Macro/Meso/Micro section.

export type LandmarkType =
  | "cabin"
  | "bridge"
  | "watchtower"
  | "portal"
  | "lodge"
  | "terrace"
  | "cairn"
  | "observatory"
  | "sluice"
  | "arboretum"
  | "gate"
  | "arch"
  | "fork"

export interface ScenicLandmarkSpec {
  moduleId: string
  landmarkType: LandmarkType
  xPercent: number
  yPercent: number
  elevationTier?: number
}

export type ZoneEnvironment =
  | "foothills"
  | "meadow"
  | "montane-forest"
  | "deep-forest"
  | "highlands"
  | "peaks"
  | "summit"

export type GatewayType = "timber-gate" | "stone-bridge" | "mountain-pass" | "ice-tunnel" | "summit-ridge"

export interface ZoneExitThreshold {
  title: string
  targetZoneId: string
  landmarkType: GatewayType
  xPercent: number
  yPercent: number
}

export interface ZoneScenicSpec {
  zoneId: string
  title: string
  environment: ZoneEnvironment
  landmarks: ScenicLandmarkSpec[]
  exitThreshold?: ZoneExitThreshold
  /** Has a purpose-built meso scenic component (Pattern Meadows, Recursive
   * Forest) vs. rendered by the generic PlaceholderZone until separately
   * designed (every other zone, this task). */
  polished: boolean
}

export type WorldCameraMode = "focused" | "zone" | "world"

export interface WorldViewState {
  cameraMode: WorldCameraMode
  activeZoneId: string
  focusedModuleId?: string
}
