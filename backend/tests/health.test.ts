// Liveness vs readiness: /health is always 200 (process is up); /ready is 503 when the database is not connected.
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("health endpoints without a database connection", () => {
  const app = createApp();
  it("/health stays 200 and reports degraded", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("degraded");
  });
  it("/ready answers 503 so a monitor can see the database is unusable", async () => {
    const res = await request(app).get("/api/v1/ready");
    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe("not-ready");
  });
});
