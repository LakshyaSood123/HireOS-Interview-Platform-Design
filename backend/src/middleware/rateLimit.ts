import type { Request, Response } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

import { env } from "../config/env.js";
import { sendError } from "../shared/envelope.js";
import { ERROR_STATUS } from "../shared/errors.js";

/**
 * Limits from docs/03-API-CONTRACT.md — "Limits".
 * Day 4 adds the `/code/run` and `/code/submit` limiters.
 */

function rejected(_req: Request, res: Response): void {
  sendError(
    res,
    ERROR_STATUS.RATE_LIMITED,
    "RATE_LIMITED",
    "Too many requests. Please wait a moment and try again.",
  );
}

/** Per authenticated user where we know one, otherwise per IP. */
function userOrIpKey(req: Request): string {
  return req.auth?.userId ?? ipKeyGenerator(req.ip ?? "unknown");
}

function build(options: Partial<Options>) {
  return rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: rejected,
    // Disabled under test so suites are not throttled into flakiness.
    skip: () => env.isTest,
    ...options,
  });
}

/** 10 per 15 min per IP — login and register. */
export const authRateLimit = build({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  skipSuccessfulRequests: false,
});

/** 120 per minute per user — everything else. */
export const generalRateLimit = build({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: userOrIpKey,
});
