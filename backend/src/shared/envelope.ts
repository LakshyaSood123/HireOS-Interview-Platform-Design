import type { Response } from "express";

import type { ErrorCode, ErrorDetails } from "./errors.js";

/**
 * Every response is `{ data, meta }` or `{ error }` — docs/03-API-CONTRACT.md.
 * `meta.requestId` is present on every success response; `error.requestId` on
 * every failure, so any line in a log can be tied to what the client saw.
 */
export interface Meta {
  requestId: string;
  [key: string]: unknown;
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: Meta;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
    requestId: string;
  };
}

export function sendData<T>(
  res: Response,
  data: T,
  status = 200,
  extraMeta: Record<string, unknown> = {},
): Response {
  const body: SuccessEnvelope<T> = {
    data,
    meta: { requestId: res.locals.requestId as string, ...extraMeta },
  };
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: ErrorDetails,
): Response {
  const body: ErrorEnvelope = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      requestId: res.locals.requestId as string,
    },
  };
  return res.status(status).json(body);
}
