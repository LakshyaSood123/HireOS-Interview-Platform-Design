export type ZoneId =
  | "basecamp"
  | "pattern-meadows"
  | "structure-woods"
  | "recursive-forest"
  | "graph-highlands"
  | "optimization-peaks"
  | "interview-summit"

export type ZoneState = "completed" | "current" | "available" | "locked"

export interface MacroZoneData {
  id: ZoneId
  index: number
  name: string
  subtitle: string
  elevation: string
  terrainDescription: string
  curriculumSummary: string
  moduleCount: number
  state: ZoneState
  x: number // SVG % or coordinate (0-1440)
  y: number // SVG % or coordinate (0-900)
  accentColor: string
}

export type RecursiveLandmarkId =
  | "recursion"
  | "backtracking"
  | "trees"
  | "bst"
  | "highland-pass"

export interface RecursiveLandmarkData {
  id: RecursiveLandmarkId
  name: string
  conceptTitle: string
  curriculumModuleId?: string
  state: ZoneState
  description: string
  environmentalIdentity: string
  routeStep: number
  x: number // SVG coordinate (0-1440)
  y: number // SVG coordinate (0-900)
  actionLabel: string
  isHero?: boolean
  isGateway?: boolean
}

export type WorldV2ViewMode = "macro" | "zone-recursive-forest"

export type MacroCameraPreset = "full-journey" | "recursive-forest-focus"

export type ZoneCameraPreset =
  | "complete-zone"
  | "wayfarer-focus" // Recursion -> Backtracking -> Trees
  | "trees-hero" // Ancient Canopy Lodge
  | "ascent-pass" // BST -> Highland Pass -> Graph Highlands tease
