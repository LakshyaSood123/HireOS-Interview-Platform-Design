import mongoose, { type ClientSession } from "mongoose";

import { logger } from "./logger.js";

/**
 * Runs a unit of work in a transaction where the deployment supports one.
 *
 * Atlas clusters are replica sets, so completion (ledger row + progress
 * update) is genuinely atomic in dev and prod — schema §"Known limitations".
 * A standalone `mongod`, which is what a developer may have locally and what
 * in-memory MongoDB gives a test run, cannot start one; there the work runs
 * un-wrapped rather than failing.
 *
 * That downgrade is safe because the transaction is not the idempotency
 * guard: the unique `{ userId, courseId, eventKey }` index is. The
 * transaction only stops a half-applied write, and an aborted transaction
 * leaves nothing behind, so re-running the body without a session cannot
 * double-apply.
 */

const UNSUPPORTED_MARKERS = [
  "Transaction numbers are only allowed on a replica set member or mongos",
  "Transactions are not supported",
  "This MongoDB deployment does not support retryable writes",
];

let transactionsSupported: boolean | null = null;

function isUnsupportedTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return UNSUPPORTED_MARKERS.some((marker) => error.message.includes(marker));
}

export async function withTransaction<T>(work: (session?: ClientSession) => Promise<T>): Promise<T> {
  if (transactionsSupported === false) return work();

  const session = await mongoose.startSession();

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    transactionsSupported = true;
    return result as T;
  } catch (error) {
    if (isUnsupportedTransactionError(error)) {
      transactionsSupported = false;
      logger.warn(
        "db: this deployment does not support transactions — completions run un-wrapped. " +
          "The unique reward-event key still prevents duplicate XP.",
      );
      return work();
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

const DUPLICATE_KEY = 11_000;

/** True for a unique-index violation — how "already completed" is detected. */
export function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: number; writeErrors?: { code?: number }[] };
  if (candidate.code === DUPLICATE_KEY) return true;
  return Boolean(candidate.writeErrors?.some((writeError) => writeError.code === DUPLICATE_KEY));
}
