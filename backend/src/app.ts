import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { createDocsRouter } from "./docs/swagger.js";
import { attachAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { generalRateLimit } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/system/health.routes.js";
import { ApiError } from "./shared/errors.js";

function corsOptions(): cors.CorsOptions {
  const allowlist = new Set(env.CORS_ORIGINS);

  return {
    origin(origin, callback) {
      // No Origin header — curl, server-to-server, same-origin. Always allowed.
      if (!origin || allowlist.has(origin)) {
        callback(null, true);
        return;
      }
      callback(ApiError.forbidden(`Origin ${origin} is not allowed.`));
    },
    credentials: true,
    maxAge: 600,
  };
}

/**
 * Builds the Express app without listening, so tests can drive it directly.
 * Order matters: request id first (everything downstream logs it), error
 * handler last.
 */
export function createApp(): Express {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use(requestId);
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: env.JSON_BODY_LIMIT }));
  if (!env.isTest) app.use(httpLogger);

  const api = express.Router();

  // Health and the contract are deliberately ahead of auth and the limiter:
  // a monitor must never be rate-limited out of reading liveness.
  api.use(healthRouter);
  api.use(createDocsRouter());

  // `attachAuth` before the limiter, so its key is the user where there is one
  // and the caller's IP otherwise. It never rejects — `requireAuth` does that.
  api.use(attachAuth);
  api.use(generalRateLimit);
  api.use(authRouter);

  app.use(env.API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
