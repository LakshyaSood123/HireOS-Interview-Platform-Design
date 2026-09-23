import { Router } from "express";

import { dbStatus } from "../../db/connect.js";
import { sendData } from "../../shared/envelope.js";

export const healthRouter = Router();

/**
 * Liveness plus database reachability — docs/03-API-CONTRACT.md.
 *
 * Always 200: this answers "is the process up and what does it see", and a
 * monitor should be able to read `db` rather than guess from a status code.
 */
healthRouter.get("/health", (_req, res) => {
  const db = dbStatus();

  sendData(res, {
    status: db === "connected" ? "ok" : "degraded",
    db,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});
