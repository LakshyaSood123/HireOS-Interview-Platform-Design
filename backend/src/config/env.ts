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
    // 128kb was too small for the CMS's own whole-tree draft save (PATCH
    // /cms/courses/:courseId/draft) — the bootstrapped dsa-foundations
    // draft alone serializes to ~178KB (107 checkpoints), so every real
    // save 413'd before ever reaching the route handler. Found while wiring
    // Creator Studio to this route. 2mb keeps real headroom for curriculum
    // growth while staying far below anything DoS-relevant, and every
    // route this limit applies to is already behind `requireAuth` (most of
    // them additionally `requireRole("admin")`).
    JSON_BODY_LIMIT: z.string().default("2mb"),

    // Logging
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    LOG_PRETTY: booleanish.default(false),

    // Animation narration (text-to-speech). Generation is admin-only and runs on the backend; learners only play stored audio.
    // "none" = no provider (default in production), "dev" = deterministic test provider (development only).
    // Real providers are registered in modules/cms/narration/narration.provider.ts; their credentials belong here too.
    NARRATION_PROVIDER: z.string().regex(/^[a-z0-9-]+$/).optional(),
    // Provider-neutral narration settings. "default" voice in a package resolves to NARRATION_DEFAULT_VOICE (a provider-specific
    // fallback applies when unset).
    NARRATION_DEFAULT_VOICE: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).optional(),
    NARRATION_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(60_000),
    // Local, offline Kokoro-82M provider (NARRATION_PROVIDER=local-kokoro). No credential. Needed only on a machine that GENERATES
    // narration; learners just play stored audio. Defaults point at backend/.models/kokoro (created by `npm run narration:setup`).
    NARRATION_LOCAL_PYTHON: z.string().min(1).optional(),
    NARRATION_LOCAL_MODEL_PATH: z.string().min(1).optional(),
    NARRATION_LOCAL_DEVICE: z.enum(["cpu", "cuda", "auto"]).default("cpu"),
    NARRATION_LOCAL_FORMAT: z.enum(["mp3", "wav"]).default("mp3"),

    // Code execution — wired on Day 4, declared here so env stays one place.
    EXECUTION_PROVIDER: z.enum(["piston", "mock"]).default("piston"),
    PISTON_URL: z.string().url().default("http://localhost:2000"),
  })
  .transform((value) => ({
    ...value,
    NARRATION_PROVIDER: value.NARRATION_PROVIDER ?? (value.NODE_ENV === "production" ? "none" : "dev"),
    isProduction: value.NODE_ENV === "production",
    isTest: value.NODE_ENV === "test",
  }));

export type Env = z.infer<typeof envSchema>;

/**
 * Extra rules that apply ONLY when NODE_ENV=production. Development keeps its
 * localhost defaults; a production process must be configured on purpose, and
 * refuses to boot on a value that would silently be wrong or unsafe. Values are
 * never printed — only which variable is wrong and why.
 */
export function productionConfigProblems(value: Env, source: NodeJS.ProcessEnv): string[] {
  if (!value.isProduction) return [];
  const problems: string[] = [];
  const explicit = (name: string) => typeof source[name] === "string" && source[name]!.trim() !== "";

  if (!explicit("CORS_ORIGINS")) {
    problems.push("CORS_ORIGINS: required in production — the exact https origin(s) of the frontend, comma separated (no localhost default).");
  } else {
    for (const origin of value.CORS_ORIGINS) {
      if (origin === "*" || origin.includes("*")) problems.push("CORS_ORIGINS: wildcard origins are not allowed (the API uses credentials).");
      else if (!/^https?:\/\/[^/\s]+$/.test(origin)) problems.push(`CORS_ORIGINS: "${origin}" must be a bare origin like https://app.example.com (scheme + host, no path).`);
      else if (/localhost|127\.0\.0\.1/.test(origin)) problems.push(`CORS_ORIGINS: "${origin}" is a local origin; not allowed in production.`);
      else if (origin.startsWith("http://")) problems.push(`CORS_ORIGINS: "${origin}" is not https.`);
    }
  }
  if (!explicit("TRUST_PROXY")) {
    problems.push("TRUST_PROXY: required in production — e.g. 1 when exactly one trusted reverse proxy sits in front (needed for real client IPs and rate limiting).");
  } else if (/^(true|\*)$/i.test(value.TRUST_PROXY.trim())) {
    problems.push("TRUST_PROXY: do not trust every proxy hop (true/*); use a hop count such as 1, or the proxy's address/CIDR.");
  }
  const weak = /replace-me|change-?me|changeme|your-secret|password/i;
  for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if (weak.test(value[name])) problems.push(`${name}: looks like a placeholder/weak value; generate a random one (node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))").`);
  }
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) problems.push("JWT_REFRESH_SECRET: must differ from JWT_ACCESS_SECRET.");
  if (!explicit("MONGO_DB_NAME")) problems.push("MONGO_DB_NAME: required in production (the default is the development database name).");
  else if (/_dev$|_test$/.test(value.MONGO_DB_NAME)) problems.push("MONGO_DB_NAME: a *_dev / *_test database name must not be used in production.");
  if (value.NARRATION_PROVIDER === "dev") problems.push("NARRATION_PROVIDER: the development narration provider must not be used in production (use a real provider id, or leave it unset for none).");
  if (value.LOG_PRETTY) problems.push("LOG_PRETTY: must be false in production (structured JSON logs).");
  return problems;
}

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

  const prodProblems = productionConfigProblems(result.data, source);
  if (prodProblems.length) {
    const lines = prodProblems.map((p) => `  - ${p}`);
    process.stderr.write(["", "Invalid PRODUCTION configuration:", ...lines, "", "See backend/.env.production.example and docs/PILOT_DEPLOYMENT.md.", "", ""].join("\n"));
    process.exit(1);
  }

  return result.data;
}

export const env: Env = parseEnv(process.env);
