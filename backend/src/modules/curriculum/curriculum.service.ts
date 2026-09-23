import { ApiError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";
import {
  CurriculumSnapshot,
  type SnapshotCheckpoint,
  type SnapshotModule,
  type SnapshotZone,
} from "./curriculum.model.js";

/**
 * The prerequisite graph, in memory.
 *
 * Every learning request needs it — "is this locked", "what unlocked", "what
 * is next" — so the active snapshot is read once and indexed, rather than
 * re-read and re-walked per request. It is seeded reference data: it changes
 * when someone runs the seeder, never because of a learner action.
 */

export interface CurriculumIndex {
  courseId: string;
  title: string;
  version: string;
  frontendCommit: string | null;
  /** Course order throughout — zones, then modules within a zone. */
  zones: SnapshotZone[];
  modules: SnapshotModule[];
  checkpoints: SnapshotCheckpoint[];
  zoneById: Map<string, SnapshotZone>;
  moduleById: Map<string, SnapshotModule>;
  checkpointById: Map<string, SnapshotCheckpoint>;
  /** Which module a checkpoint belongs to — the lookup the engine does most. */
  moduleIdByCheckpointId: Map<string, string>;
  zoneIdByModuleId: Map<string, string>;
}

const cache = new Map<string, CurriculumIndex>();

/**
 * Builds the in-memory index from a snapshot. Exported because the engine
 * parity check and the Day 7 tests build one straight from the registry,
 * without a database in the way.
 */
export function buildCurriculumIndex(snapshot: {
  courseId: string;
  title: string;
  version: string;
  frontendCommit?: string | null;
  zones: SnapshotZone[];
  modules: SnapshotModule[];
  checkpoints: SnapshotCheckpoint[];
}): CurriculumIndex {
  const zones = [...snapshot.zones].sort((a, b) => a.order - b.order);
  const modules = [...snapshot.modules].sort((a, b) => a.order - b.order);
  const checkpoints = [...snapshot.checkpoints];

  const moduleById = new Map(modules.map((entry) => [entry.id, entry]));
  const moduleIdByCheckpointId = new Map<string, string>();
  for (const entry of modules) {
    for (const checkpointId of entry.checkpointIds) moduleIdByCheckpointId.set(checkpointId, entry.id);
  }

  return {
    courseId: snapshot.courseId,
    title: snapshot.title,
    version: snapshot.version,
    frontendCommit: snapshot.frontendCommit ?? null,
    zones,
    modules,
    checkpoints,
    zoneById: new Map(zones.map((entry) => [entry.id, entry])),
    moduleById,
    checkpointById: new Map(checkpoints.map((entry) => [entry.id, entry])),
    moduleIdByCheckpointId,
    zoneIdByModuleId: new Map(modules.map((entry) => [entry.id, entry.zoneId])),
  };
}

/** Reads the active snapshot for a course, or null if none has been seeded. */
export async function loadCurriculum(courseId: string): Promise<CurriculumIndex | null> {
  const cached = cache.get(courseId);
  if (cached) return cached;

  const snapshot = await CurriculumSnapshot.findOne({ courseId, isActive: true }).lean();
  if (!snapshot) return null;

  const index = buildCurriculumIndex(snapshot);
  cache.set(courseId, index);
  return index;
}

/**
 * The same, but a missing course is a 404 rather than a null.
 *
 * An unseeded database and an unknown course id are the same answer to a
 * client — the course does not exist here — but the message names the seeder
 * so the cause is obvious to whoever is running the server.
 */
export async function requireCurriculum(courseId: string): Promise<CurriculumIndex> {
  const curriculum = await loadCurriculum(courseId);
  if (curriculum) return curriculum;

  const seeded = await CurriculumSnapshot.countDocuments({});
  throw ApiError.notFound(
    seeded === 0
      ? `No curriculum is seeded. Run "npm run seed:curriculum" before using the learning API.`
      : `Unknown course "${courseId}".`,
  );
}

export function forgetCurriculum(courseId?: string): void {
  if (courseId) cache.delete(courseId);
  else cache.clear();
}

/**
 * Warms the cache at boot and says, in one log line, what the server will
 * answer with. A server with no curriculum still boots and still serves auth
 * and health — the learning endpoints are the only thing that 404s.
 */
export async function warmCurriculumCache(): Promise<void> {
  const snapshots = await CurriculumSnapshot.find({ isActive: true }).lean();

  if (snapshots.length === 0) {
    logger.warn('curriculum: no active snapshot — run "npm run seed:curriculum". Learning endpoints will 404.');
    return;
  }

  for (const snapshot of snapshots) {
    const index = buildCurriculumIndex(snapshot);
    cache.set(index.courseId, index);
    logger.info(
      {
        courseId: index.courseId,
        version: index.version,
        zones: index.zones.length,
        modules: index.modules.length,
        checkpoints: index.checkpoints.length,
      },
      "curriculum: loaded",
    );
  }
}
