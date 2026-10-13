// Production-only configuration rules (src/config/env.ts). Development keeps its localhost defaults.
import { describe, expect, it } from "vitest";

import { productionConfigProblems, type Env } from "../src/config/env.js";

const good = {
  NODE_ENV: "production", isProduction: true, isTest: false,
  JWT_ACCESS_SECRET: "q7Zx2mLw9RtYp4HcVb8NsKd3FgJu6EaTo1WiXzCv5MrBnPy0",
  JWT_REFRESH_SECRET: "Ak3Sd8Fg1Hj6Kl0Zx5Cv9Bn4Mq2We7Rt3Yu8Io1PaSdFgHjKl",
  CORS_ORIGINS: ["https://learn.example.org"], TRUST_PROXY: "1", MONGO_DB_NAME: "reagvis_prod", LOG_PRETTY: false,
} as unknown as Env;
const sourceGood = { CORS_ORIGINS: "https://learn.example.org", TRUST_PROXY: "1", MONGO_DB_NAME: "reagvis_prod" } as NodeJS.ProcessEnv;

describe("productionConfigProblems", () => {
  it("accepts a deliberate production configuration", () => {
    expect(productionConfigProblems(good, sourceGood)).toEqual([]);
  });
  it("does nothing outside production", () => {
    expect(productionConfigProblems({ ...good, isProduction: false, CORS_ORIGINS: ["http://localhost:8443"] } as Env, {})).toEqual([]);
  });
  it("requires explicit CORS_ORIGINS, TRUST_PROXY and MONGO_DB_NAME (no silent dev defaults)", () => {
    const p = productionConfigProblems(good, {}).join("\n");
    expect(p).toMatch(/CORS_ORIGINS: required/);
    expect(p).toMatch(/TRUST_PROXY: required/);
    expect(p).toMatch(/MONGO_DB_NAME: required/);
  });
  it("rejects wildcard, localhost and plain-http origins", () => {
    for (const origin of ["*", "https://*.example.org", "http://localhost:8443", "http://learn.example.org", "https://learn.example.org/app"]) {
      expect(productionConfigProblems({ ...good, CORS_ORIGINS: [origin] } as Env, sourceGood).length, origin).toBeGreaterThan(0);
    }
  });
  it("rejects trusting every proxy hop", () => {
    expect(productionConfigProblems({ ...good, TRUST_PROXY: "true" } as Env, sourceGood).join()).toMatch(/TRUST_PROXY/);
  });
  it("rejects placeholder or identical JWT secrets, dev/test databases and pretty logs without echoing secrets", () => {
    const bad = { ...good, JWT_ACCESS_SECRET: "replace-me-with-at-least-32-random-characters", JWT_REFRESH_SECRET: "replace-me-with-at-least-32-random-characters", MONGO_DB_NAME: "reagvis_dev", LOG_PRETTY: true } as Env;
    const p = productionConfigProblems(bad, { ...sourceGood, MONGO_DB_NAME: "reagvis_dev" });
    expect(p.join("\n")).toMatch(/JWT_ACCESS_SECRET/);
    expect(p.join("\n")).toMatch(/JWT_REFRESH_SECRET/);
    expect(p.join("\n")).toMatch(/MONGO_DB_NAME/);
    expect(p.join("\n")).toMatch(/LOG_PRETTY/);
    expect(p.join("\n")).not.toContain("replace-me-with-at-least-32-random-characters");
  });
});
