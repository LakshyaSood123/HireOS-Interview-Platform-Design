import mongoose from "mongoose";

import { env } from "../config/env.js";
import { logger } from "../shared/logger.js";
import { models } from "./models.js";

export type DbStatus = "connected" | "connecting" | "disconnected";

const READY_STATE: Record<number, DbStatus> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnected",
};

export function dbStatus(): DbStatus {
  return READY_STATE[mongoose.connection.readyState] ?? "disconnected";
}

/**
 * Connect to MongoDB Atlas and build indexes.
 *
 * Indexes are created here rather than by Mongoose's `autoIndex`, so that boot
 * fails loudly on a bad index instead of silently racing the first request.
 */
export async function connectToDatabase(uri: string = env.MONGO_URI): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  // A query that cannot reach the database should fail in seconds, not hang.
  mongoose.set("bufferTimeoutMS", 10_000);

  mongoose.connection.on("error", (error) => {
    logger.error({ err: error }, "db: connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("db: disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    logger.info("db: reconnected");
  });

  await mongoose.connect(uri, {
    dbName: env.MONGO_DB_NAME,
    autoIndex: false,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
  });

  logger.info({ database: mongoose.connection.name }, "db: connected");

  await ensureIndexes();

  return mongoose;
}

export async function ensureIndexes(): Promise<void> {
  await Promise.all(models.map((model) => model.createIndexes()));
  logger.info({ collections: models.length }, "db: indexes ready");
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info("db: closed");
}
