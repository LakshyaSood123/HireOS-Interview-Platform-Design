import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

import { ApiError } from "../shared/errors.js";

export interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Validates body, params and query with Zod and stores the parsed values on
 * `req.validated`.
 *
 * Handlers read `req.validated.*`, never `req.body` — so unvalidated input has
 * no path into a service, and Express 5's read-only `req.query` is left alone.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = {};

    for (const source of ["params", "query", "body"] as const) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        next(
          ApiError.validation("The request is invalid.", {
            source,
            issues: result.error.issues.map((issue) => ({
              path: issue.path.join(".") || source,
              message: issue.message,
              code: issue.code,
            })),
          }),
        );
        return;
      }

      req.validated[source] = result.data;
    }

    next();
  };
}

/** Typed accessors, so handlers do not litter themselves with casts. */
export function body<T>(req: Request): T {
  return req.validated.body as T;
}

export function params<T>(req: Request): T {
  return req.validated.params as T;
}

export function query<T>(req: Request): T {
  return req.validated.query as T;
}
