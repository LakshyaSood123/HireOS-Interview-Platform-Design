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
  harnessKey?: string;
}

export interface CmsAnimationRef {
  id: string;
  title?: string;
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
  detail?: string;
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
  learnMore?: string;
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
  animation?: CmsAnimationRef;
}

export interface CmsCheckpoint {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  type: CmsCheckpointType;
  xp: number;
  masteryXp?: number;
  prerequisites: string[];
  legacyNodeId?: number;
  workspace?: CmsWorkspace;
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
