/**
 * The backend's OWN structured-course content contract — a pure DTO, not an
 * import of any frontend module. This is deliberately a near-mirror of the
 * frontend's `src/creator/dsa/dsaCmsTypes.ts` shapes (same concept: Zone ->
 * Module -> Checkpoint -> workspace content), but independently defined
 * here so the backend never depends on `src/creator/**` or any other
 * React-adjacent frontend code — see Phase 3B plan §5, "backend/shared
 * curriculum representation."
 *
 * If the frontend's authoring shape changes, this file changes too, by
 * hand, as its own reviewed diff — never by importing the frontend type.
 */

export const CMS_ENTITY_STATES = ["active", "archived"] as const;
export type CmsEntityState = (typeof CMS_ENTITY_STATES)[number];

export const CMS_CHECKPOINT_TYPES = ["lesson", "checkpoint", "challenge", "boss"] as const;
export type CmsCheckpointType = (typeof CMS_CHECKPOINT_TYPES)[number];

export const CMS_LANGUAGES = ["python", "cpp", "java", "javascript"] as const;
export type CmsLanguage = (typeof CMS_LANGUAGES)[number];

export const CMS_EXECUTION_MODES = ["disabled", "mock", "piston"] as const;
export type CmsExecutionMode = (typeof CMS_EXECUTION_MODES)[number];

export interface CmsTheoryBlock {
  heading: string;
  body: string;
}

export interface CmsCodeExample {
  language: CmsLanguage;
  code: string;
}

export interface CmsQuickCheck {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CmsTestCase {
  id: string;
  description: string;
  input: string;
  expected: string;
}

/**
 * `executionMode`/`harnessKey` are the CMS/Piston execution-permission
 * contract (Phase 3B plan §12). A new CMS-authored coding activity always
 * starts `"disabled"`. `"piston"` is only accepted at publish time when
 * `harnessKey` matches the backend's own copy of the Family A allowlist —
 * see `pistonHarnessKeys.ts`. The CMS never stores a shell command, a file
 * path, or any executable content — only this reference key.
 */
export interface CmsCodingActivity {
  prompt: string;
  constraints?: string[];
  functionName: string;
  requiredKeywords: string[];
  starterCode: Partial<Record<CmsLanguage, string>>;
  languages: CmsLanguage[];
  visibleTests: CmsTestCase[];
  hiddenTests: CmsTestCase[];
  hint: string;
  mistakeFeedback: string;
  executionMode: CmsExecutionMode;
  // `| null` on this and the other fields below marked the same way: the
  // Mongoose model persists them with `default: null`, so a GET of an
  // untouched draft serializes `null`, not `undefined` — the save schema
  // (cms.schema.ts) now accepts both, and these types mirror that.
  harnessKey?: string | null;
}

export interface CmsAnimationRef {
  id: string;
  title?: string | null;
}

export const CMS_CUSTOM_BRIDGE_MODES = ["standalone", "controlled", "synchronized"] as const;
export type CmsCustomBridgeMode = (typeof CMS_CUSTOM_BRIDGE_MODES)[number];

/**
 * A checkpoint's animation now has two possible sources. `kind` is optional
 * ON READ ONLY — every `CmsCourseVersion` document written before this
 * change stored the old bare `{ id, title? }` shape with no `kind` field at
 * all, and that data must keep loading without a migration (Phase 3B plan's
 * own backwards-compatibility rule, extended here to the deferred authoring
 * subsystem). `normalizeAnimationSource` below is the one place that
 * absence is resolved to `"registered"`. New writes always set `kind`
 * explicitly (see cms.schema.ts's `animationSourceSchema`, which requires
 * it).
 */
export interface CmsRegisteredAnimationSource {
  kind: "registered";
  id: string;
  title?: string | null;
}
export interface CmsCustomAnimationSource {
  kind: "custom";
  packageId: string;
  /** `"draft"` while the course draft is being edited; frozen at publish
   * time to an immutable `"r1"`, `"r2"`, … — see animationPackage.service.ts's
   * `freezePackageRevisionIfNeeded`. */
  revisionId: string;
  title?: string | null;
  bridgeMode: CmsCustomBridgeMode;
}
export type CmsAnimationSource = CmsRegisteredAnimationSource | CmsCustomAnimationSource;

/**
 * The deferred Code Trace authoring subsystem. Deliberately a SEPARATE,
 * simpler, string-id-keyed model from the existing learner-runtime
 * `AlgorithmCodeTrace` (frontend `codeTraceTypes.ts`) — that type
 * synchronizes trace state to a REGISTERED animation's numeric state index
 * (`states[i]` <-> animation `states[i]`) and stays completely untouched by
 * this change (existing Code Trace: unchanged, per this phase's explicit
 * backwards-compatibility requirement). A CMS-authored trace instead keys
 * each step by a semantic `animationEvent` string id, matching how the
 * Animation Bridge's STEP_CHANGED/GOTO_STEP messages identify steps for a
 * CUSTOM animation (which has no numeric "state index" at all) — see
 * animationBridge.ts on the frontend.
 */
export interface CmsTraceStep {
  stepId: string;
  label: string;
  pseudocode: string;
  python?: string | null;
  cpp?: string | null;
  java?: string | null;
  /** The custom animation's semantic step id this trace step corresponds
   * to (matches a package's declared `manifest.traceEvents` entry, and what
   * arrives in a STEP_CHANGED/GOTO_STEP bridge message) — optional, since an
   * author may write trace steps before wiring animation sync. */
  animationEvent?: string | null;
}

export const CMS_TRACE_SOURCE_KINDS = ["registered", "cms", "package", "none"] as const;
export type CmsTraceSourceKind = (typeof CMS_TRACE_SOURCE_KINDS)[number];

export interface CmsTraceSource {
  kind: CmsTraceSourceKind;
  /** Only meaningful for `kind: "cms"` — ignored otherwise. */
  steps?: CmsTraceStep[];
}

/**
 * The deferred Preview Draft layout editor. A constrained 12-column grid —
 * never free x/y positioning. Scoped to ONE checkpoint's own lesson blocks
 * (not page-level chrome, which this never touches at all). Absent `layout`
 * = the current, existing stacked order (Concepts -> Animation -> Code
 * Trace -> Quick Check -> Coding), so every pre-existing checkpoint needs
 * zero migration — see `DEFAULT_LAYOUT_BLOCK_ORDER`.
 */
export const CMS_LAYOUT_BLOCK_TYPES = ["concepts", "animation", "codeTrace", "quickCheck", "coding"] as const;
export type CmsLayoutBlockType = (typeof CMS_LAYOUT_BLOCK_TYPES)[number];

/** The implicit layout every checkpoint without an explicit `layout` field
 * already has, today, via LessonWorkspace's own fixed rendering order —
 * this is documentation of that existing order, not a new default that
 * changes anything. */
export const DEFAULT_LAYOUT_BLOCK_ORDER: readonly CmsLayoutBlockType[] = ["concepts", "animation", "codeTrace", "quickCheck", "coding"];

export const CMS_LAYOUT_VERSION = 1;

export interface CmsLayoutBlock {
  type: CmsLayoutBlockType;
  /** 1-12 — a 12-column grid, same convention as the rest of the spec. */
  span: number;
  hidden?: boolean;
}
export interface CmsLayoutRow {
  blocks: CmsLayoutBlock[];
}
export interface CmsLayout {
  version: number;
  rows: CmsLayoutRow[];
}

/** Resolves a possibly-legacy stored animation reference (old data has no
 * `kind`) into the current discriminated shape. Never throws — an
 * unrecognized `kind` on read (should not happen from this codebase, but
 * defends against a bad direct DB write) also falls back to `"registered"`
 * with whatever `id`/fields are present, letting the normal "unknown
 * animation id" publish-validation catch it rather than crashing. */
export function normalizeAnimationSource(ref: unknown): CmsAnimationSource | undefined {
  if (!ref || typeof ref !== "object") return undefined;
  const r = ref as Record<string, unknown>;
  if (r.kind === "custom" && typeof r.packageId === "string" && typeof r.revisionId === "string") {
    return {
      kind: "custom",
      packageId: r.packageId,
      revisionId: r.revisionId,
      title: typeof r.title === "string" ? r.title : null,
      bridgeMode: CMS_CUSTOM_BRIDGE_MODES.includes(r.bridgeMode as CmsCustomBridgeMode) ? (r.bridgeMode as CmsCustomBridgeMode) : "standalone",
    };
  }
  if (typeof r.id === "string") {
    return { kind: "registered", id: r.id, title: typeof r.title === "string" ? r.title : null };
  }
  return undefined;
}

/** Trees module only — a small binary tree plus its three traversal orders. */
export interface CmsTreeVizNode {
  value: number;
  left?: CmsTreeVizNode;
  right?: CmsTreeVizNode;
}
export interface CmsTraversalVisual {
  tree: CmsTreeVizNode;
  preorder: number[];
  inorder: number[];
  postorder: number[];
}

/** Recursion module only — call-stack push/base-case/return steps. */
export interface CmsCallStackFrame {
  label: string;
  kind: "call" | "base-case" | "return";
  detail?: string | null;
}
export interface CmsCallStackVisual {
  frames: CmsCallStackFrame[];
}

/** Two Pointers module only — the array plus which pointer pattern it demonstrates. */
export interface CmsTwoPointerVisual {
  values: number[];
  mode: "opposite" | "same-direction";
}

export interface CmsWorkspace {
  title: string;
  theory: CmsTheoryBlock[];
  learnMore?: string | null;
  /** These three mirror the frontend's `LessonWorkspaceContent`'s own
   * module-specific visual fields 1:1 (Phase 3B needs full-fidelity
   * round-tripping of the current DSA content, not just the animation/
   * quickCheck/codingActivity fields) — see `bootstrapDsaCms.ts`. */
  visual?: CmsTraversalVisual;
  callStackVisual?: CmsCallStackVisual;
  twoPointerVisual?: CmsTwoPointerVisual;
  codeExamples?: CmsCodeExample[];
  quickCheck?: CmsQuickCheck;
  codingActivity?: CmsCodingActivity;
  animation?: CmsAnimationSource;
  /** Absent = "registered" (the pre-existing default: this checkpoint's
   * registered animation, if any, keeps using its existing Code Trace
   * registry entry exactly as before — no migration needed). */
  traceSource?: CmsTraceSource;
}

export interface CmsCheckpoint {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  type: CmsCheckpointType;
  xp: number;
  masteryXp?: number | null;
  prerequisites: string[];
  legacyNodeId?: number | null;
  workspace?: CmsWorkspace;
  /** Absent = the existing default block order — see `CmsLayout`'s header
   * comment. */
  layout?: CmsLayout;
  state: CmsEntityState;
}

export interface CmsModule {
  id: string;
  zoneId: string;
  order: number;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  contentKind?: "legacy" | "workspace";
  checkpoints: CmsCheckpoint[];
  state: CmsEntityState;
}

export interface CmsZone {
  id: string;
  order: number;
  title: string;
  description: string;
  modules: CmsModule[];
  state: CmsEntityState;
}

export const CMS_COURSE_TYPES = ["standard", "structured-dsa"] as const;
export type CmsCourseType = (typeof CMS_COURSE_TYPES)[number];

/** The full authored content of one course version — what a `cmsCourseVersions`
 * document stores. `courseType: "standard"` versions leave `zones` empty for
 * now (Phase 3B only implements structured-DSA persistence — plan §20). */
export interface CmsVersionContent {
  courseId: string;
  title: string;
  courseType: CmsCourseType;
  zones: CmsZone[];
}
