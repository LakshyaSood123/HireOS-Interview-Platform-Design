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

/**
 * Auth throttling — pilot policy (docs/PILOT_DEPLOYMENT.md "Rate limits").
 *
 * The earlier policy was ONE shared 10-per-15-minutes-per-IP bucket for register
 * and login, which locks a whole office or campus behind a single NAT out after
 * ten people sign up. It is replaced by three narrower buckets:
 *
 *  - register:       30 per 15 min per IP. Ten testers onboarding from one IP fit with
 *                    headroom; an account-creation flood from one address still stops.
 *  - login/identity: 8 FAILED attempts per 15 min per (IP + email). This is the
 *                    brute-force guard: one account being guessed is throttled while
 *                    other people on the same IP are unaffected. Successful logins
 *                    are not counted.
 *  - login/IP:       100 FAILED attempts per 15 min per IP. A backstop against one
 *                    address spraying many different emails.
 *
 * Storage is the library's default in-memory store: correct for a single backend
 * instance (the pilot), NOT shared across instances or restarts. A multi-instance
 * production deployment must move these to a shared store (e.g. Redis).
 */
export interface AuthLimiterOptions {
  /** Overridable so tests can exercise the real limiters (they are skipped when NODE_ENV=test). */
  skip?: () => boolean;
}

/** Normalised identity used as part of the login key. Never logged. */
export function loginIdentity(req: Request): string {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
}

export function createAuthLimiters(options: AuthLimiterOptions = {}) {
  const skip = options.skip ?? (() => env.isTest);
  const window15 = 15 * 60 * 1000;
  return {
    registerLimit: build({
      windowMs: window15,
      limit: 30,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
      skip,
    }),
    loginIdentityLimit: build({
      windowMs: window15,
      limit: 8,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? "unknown")}|${loginIdentity(req)}`,
      skipSuccessfulRequests: true,
      skip,
    }),
    loginIpLimit: build({
      windowMs: window15,
      limit: 100,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
      skipSuccessfulRequests: true,
      skip,
    }),
  };
}

const defaultAuthLimiters = createAuthLimiters();
export const registerRateLimit = defaultAuthLimiters.registerLimit;
export const loginRateLimit = [defaultAuthLimiters.loginIpLimit, defaultAuthLimiters.loginIdentityLimit];

/** Permanent course deletion re-checks a password, so it is throttled per admin: 10 attempts per 15 minutes. */
export const permanentDeleteRateLimit = build({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: userOrIpKey,
});

/** 120 per minute per user — everything else. */
export const generalRateLimit = build({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: userOrIpKey,
});
