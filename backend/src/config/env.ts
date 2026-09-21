import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

/**
 * Every environment variable, in one place, validated at boot.
 *
 * Checkpoint 1.2: a missing `MONGO_URI` fails loudly at startup, not on the
 * first request. Nothing else in the codebase reads `process.env` directly.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_ROOT = path.resolve(here, "..", "..");
export const REPO_ROOT = path.resolve(BACKEND_ROOT, "..");

loadDotenv({ path: path.join(BACKEND_ROOT, ".env"), quiet: true });

const booleanish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1");

const csv = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4883),
    API_PREFIX: z.string().startsWith("/").default("/api/v1"),

    // Database — MongoDB Atlas. Secret; never committed.
    MONGO_URI: z
      .string({ error: "required — the MongoDB Atlas connection string" })
      .min(1, "required — the MongoDB Atlas connection string"),
    MONGO_DB_NAME: z.string().min(1).default("reagvis_dev"),

    // Auth
    JWT_ACCESS_SECRET: z
      .string({ error: "required — at least 32 random characters" })
      .min(32, "must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string({ error: "required — at least 32 random characters, different from JWT_ACCESS_SECRET" })
      .min(32, "must be at least 32 characters"),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // HTTP
    // `.default()` supplies the parsed output, so this is the list, not a CSV string.
    CORS_ORIGINS: csv.default(["http://localhost:8443", "http://localhost:5173", "http://localhost:3000", "http://localhost:4883"]),
    TRUST_PROXY: z.string().default("loopback"),
    JSON_BODY_LIMIT: z.string().default("128kb"),

    // Logging
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    LOG_PRETTY: booleanish.default(false),

    // Code execution — wired on Day 4, declared here so env stays one place.
    EXECUTION_PROVIDER: z.enum(["piston", "mock"]).default("piston"),
    PISTON_URL: z.string().url().default("http://localhost:2000"),
  })
  .transform((value) => ({
    ...value,
    isProduction: value.NODE_ENV === "production",
    isTest: value.NODE_ENV === "test",
  }));

export type Env = z.infer<typeof envSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    const hint = existsSync(path.join(BACKEND_ROOT, ".env"))
      ? "Check backend/.env against backend/.env.example."
      : "backend/.env is missing — copy backend/.env.example to backend/.env and fill it in.";

    // Thrown before the logger exists, so this is intentionally a plain write.
    process.stderr.write(`\nInvalid environment configuration:\n${problems}\n\n${hint}\n\n`);
    process.exit(1);
  }

  return result.data;
}

export const env: Env = parseEnv(process.env);
