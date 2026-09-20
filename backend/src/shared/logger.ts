import { pino } from "pino";

import { env } from "../config/env.js";

/**
 * Redaction is not cosmetic — checkpoint 1.x requires that a password, a token
 * or a password hash never reaches a log line. Anything added here must stay
 * in sync with new request shapes (Day 4 adds `sourceCode`).
 */
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.currentPassword",
  "req.body.newPassword",
  "req.body.refreshToken",
  "req.body.code",
  "req.body.sourceCode",
  "res.headers['set-cookie']",
  "password",
  "passwordHash",
  "accessToken",
  "refreshToken",
  "tokenHash",
  "*.password",
  "*.passwordHash",
  "*.accessToken",
  "*.refreshToken",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  base: { service: "reagvis-trails-api", env: env.NODE_ENV },
  ...(env.LOG_PRETTY
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname,service,env" },
        },
      }
    : {}),
});

export type Logger = typeof logger;
