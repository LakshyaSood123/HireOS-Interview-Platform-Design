import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";

import { sendError } from "../shared/envelope.js";
import { ApiError, isApiError } from "../shared/errors.js";
import { logger } from "../shared/logger.js";

/** Anything that fell through the router is a 404 in the standard envelope. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}.`));
};

interface BodyParserError extends Error {
  type?: string;
  status?: number;
  statusCode?: number;
}

function normalise(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (error instanceof Error) {
    const candidate = error as BodyParserError;

    // express.json() failures — malformed JSON, or a body over the size cap.
    if (candidate.type === "entity.too.large") {
      return new ApiError("PAYLOAD_TOO_LARGE", "The request body is too large.");
    }
    if (candidate.type === "entity.parse.failed") {
      return ApiError.validation("The request body is not valid JSON.");
    }
  }

  return new ApiError("INTERNAL_ERROR", "Something went wrong.");
}

/**
 * The single place an error becomes a response. Client errors are logged at
 * `warn` without a stack; only unexpected failures log the original error.
 */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const apiError = normalise(error);
  const context = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    code: apiError.code,
    status: apiError.status,
    userId: req.auth?.userId,
  };

  if (apiError.status >= 500) {
    logger.error({ ...context, err: error }, "request failed");
  } else {
    logger.warn(context, "request rejected");
  }

  sendError(res, apiError.status, apiError.code, apiError.message, apiError.details);
};
