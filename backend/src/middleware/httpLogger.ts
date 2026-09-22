import { pinoHttp } from "pino-http";

import { logger } from "../shared/logger.js";

/**
 * One log line per request, carrying the request id so a client-reported
 * `requestId` can be found directly in the logs.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as { requestId?: string }).requestId ?? "req_unknown",
  customProps: (req) => ({ userId: (req as { auth?: { userId: string } }).auth?.userId }),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // The error handler already logs failures with full context.
  customErrorMessage: () => "request errored",
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
