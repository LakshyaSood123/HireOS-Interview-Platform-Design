import { Router } from "express";

import { dbStatus } from "../../db/connect.js";
import { sendData } from "../../shared/envelope.js";

export const healthRouter = Router();

/**
 * Liveness plus database reachability — docs/03-API-CONTRACT.md.
 *
 * `/health` always answers 200: it says "the process is up and here is what it
 * sees", so a monitor can read `db` rather than guess from a status code. It is
 * the LIVENESS probe — do not restart a healthy process just because Mongo blipped.
 */
healthRouter.get("/health", (_req, res) => {
  const db = dbStatus();

  sendData(res, {
    status: db === "connected" ? "ok" : "degraded",
    db,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * READINESS: 200 only when the database is connected, otherwise 503. Use this
 * for the load balancer / uptime monitor that decides whether to send learners
 * here ("can this instance serve a lesson right now?").
 */
healthRouter.get("/ready", (_req, res) => {
  const db = dbStatus();
  const ready = db === "connected";
  sendData(res, { status: ready ? "ready" : "not-ready", db }, ready ? 200 : 503);
});
