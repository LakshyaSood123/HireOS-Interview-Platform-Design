import type { Server } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "./db/connect.js";
import { warmCurriculumCache } from "./modules/curriculum/curriculum.service.js";
import { logger } from "./shared/logger.js";

/**
 * Boot order: the database first, so a bad `MONGO_URI` fails at startup rather
 * than on the first request. Then the curriculum, so the prerequisite graph is
 * in memory before the first learner request and an unseeded database says so
 * in the boot log instead of on a 404.
 */
async function start(): Promise<void> {
  await connectToDatabase();
  await warmCurriculumCache();

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        api: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        docs: `http://localhost:${env.PORT}${env.API_PREFIX}/docs`,
      },
      "api: listening",
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "api: shutting down");

    server.close(async () => {
      await disconnectFromDatabase();
      process.exit(0);
    });

    // Never let a hung connection hold the process open forever.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "api: unhandled rejection");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "api: uncaught exception");
  process.exit(1);
});

start().catch((error) => {
  logger.fatal({ err: error }, "api: failed to start");
  process.exit(1);
});
