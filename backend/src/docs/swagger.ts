import { readFileSync } from "node:fs";
import path from "node:path";

import { Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";

import { BACKEND_ROOT, REPO_ROOT } from "../config/env.js";
import { logger } from "../shared/logger.js";

/**
 * Serves the hand-written contract at `{API_PREFIX}/docs`.
 *
 * The spec is the one in `docs/openapi.yaml` — there is no generated copy, so
 * Swagger and the contract document cannot drift apart.
 */
const CANDIDATE_SPEC_PATHS = [
  path.join(REPO_ROOT, "docs", "openapi.yaml"),
  path.join(BACKEND_ROOT, "docs", "openapi.yaml"),
];

interface LoadedSpec {
  spec: Record<string, unknown>;
  filePath: string;
}

export function loadOpenApiSpec(): LoadedSpec | null {
  for (const filePath of CANDIDATE_SPEC_PATHS) {
    try {
      const raw = readFileSync(filePath, "utf8");
      return { spec: parse(raw) as Record<string, unknown>, filePath };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  logger.warn({ looked: CANDIDATE_SPEC_PATHS }, "docs: openapi.yaml not found");
  return null;
}

export function createDocsRouter(): Router {
  const router = Router();
  const loaded = loadOpenApiSpec();

  if (!loaded) return router;

  // Swagger UI needs inline styles and its own scripts, which the strict
  // global CSP forbids. Relaxing it here keeps the rest of the API strict.
  router.use("/docs", helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  router.get("/docs/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(readFileSync(loaded.filePath, "utf8"));
  });

  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(loaded.spec, {
      customSiteTitle: "Reagvis Trails API",
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  logger.info({ spec: loaded.filePath }, "docs: swagger ready");
  return router;
}
