import { randomBytes } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

const SAFE_INBOUND_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function newRequestId(): string {
  return `req_${randomBytes(6).toString("hex")}`;
}

/**
 * Stamps every request with an id, echoed back on the response header and
 * carried into `meta.requestId` / `error.requestId` by the envelope helpers.
 * An inbound `x-request-id` is honoured only if it is short and safe, so a
 * client cannot inject arbitrary text into our logs.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header("x-request-id");
  const id = inbound && SAFE_INBOUND_ID.test(inbound) ? inbound : newRequestId();

  req.requestId = id;
  res.locals.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
