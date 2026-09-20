import type { NextFunction, Request, RequestHandler, Response } from "express";

import { verifyAccessToken } from "../modules/auth/tokens.js";
import { ApiError } from "../shared/errors.js";

function readBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;

  return token.trim() || null;
}

/**
 * The only way `req.auth` is ever set.
 *
 * Identity comes from the verified token and nothing else — a `userId` in a
 * body, query or header is ignored everywhere in this codebase.
 *
 * This runs app-wide and never rejects, so that the per-user rate limiter and
 * the request logger downstream know who is calling. Enforcement is
 * `requireAuth`'s job; a bad token is remembered and surfaced there.
 */
export const attachAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch (error) {
    req.authError = error as ApiError;
  }

  next();
};

/** Guards a route. Requires `attachAuth` to have run first. */
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.auth) {
    next();
    return;
  }

  next(req.authError ?? ApiError.unauthenticated("Authentication required."));
};

/** Reads the authenticated user id, or throws if a route forgot `requireAuth`. */
export function currentUserId(req: Request): string {
  if (!req.auth) throw ApiError.unauthenticated();
  return req.auth.userId;
}
