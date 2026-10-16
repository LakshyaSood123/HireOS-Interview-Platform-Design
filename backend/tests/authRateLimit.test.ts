// Pilot auth throttling policy (see src/middleware/rateLimit.ts): several different people behind one public IP must be
// able to register and sign in, while repeated failures against ONE account are throttled.
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createAuthLimiters } from "../src/middleware/rateLimit.js";

function appWithLimiters() {
  const { registerLimit, loginIdentityLimit, loginIpLimit } = createAuthLimiters({ skip: () => false });
  const app = express();
  app.use(express.json());
  app.post("/register", registerLimit, (_req, res) => res.status(201).json({ ok: true }));
  app.post("/login", loginIpLimit, loginIdentityLimit, (req, res) => {
    // stand-in for the real handler: only the password "correct" succeeds
    if (req.body.password === "correct") res.json({ ok: true });
    else res.status(401).json({ error: "bad credentials" });
  });
  return app;
}

describe("auth rate limits", () => {
  it("lets ten distinct people register and sign in from one IP", async () => {
    const app = appWithLimiters();
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post("/register").send({ email: `user${i}@example.com` })).status).toBe(201);
    }
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post("/login").send({ email: `user${i}@example.com`, password: "correct" })).status).toBe(200);
    }
  });

  it("throttles repeated bad logins for one identity with 429, without blocking others on the same IP", async () => {
    const app = appWithLimiters();
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) statuses.push((await request(app).post("/login").send({ email: "victim@example.com", password: "wrong" })).status);
    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(401));
    expect(statuses.slice(8)).toEqual([429, 429]);
    // even the right password is refused while throttled, but another account is unaffected
    expect((await request(app).post("/login").send({ email: "victim@example.com", password: "correct" })).status).toBe(429);
    expect((await request(app).post("/login").send({ email: "someone-else@example.com", password: "correct" })).status).toBe(200);
  });

  it("treats the email case-insensitively and does not count successful logins", async () => {
    const app = appWithLimiters();
    for (let i = 0; i < 20; i++) expect((await request(app).post("/login").send({ email: "Good@Example.com", password: "correct" })).status).toBe(200);
    for (let i = 0; i < 8; i++) await request(app).post("/login").send({ email: "CASE@example.com", password: "wrong" });
    expect((await request(app).post("/login").send({ email: "case@EXAMPLE.com", password: "wrong" })).status).toBe(429);
  });

  it("stops an account-creation flood from one IP", async () => {
    const app = appWithLimiters();
    const statuses: number[] = [];
    for (let i = 0; i < 32; i++) statuses.push((await request(app).post("/register").send({ email: `flood${i}@example.com` })).status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(30);
    expect(statuses.slice(30)).toEqual([429, 429]);
  });
  it("keeps the per-IP backstop: a flood of failed logins across many accounts from one IP is stopped, successful logins are not counted", async () => {
    const app = appWithLimiters();
    for (let i = 0; i < 20; i++) expect((await request(app).post("/login").send({ email: "ok@example.com", password: "correct" })).status).toBe(200);
    const statuses: number[] = [];
    for (let i = 0; i < 102; i++) statuses.push((await request(app).post("/login").send({ email: `target${i}@example.com`, password: "wrong" })).status);
    expect(statuses.filter((s) => s === 401)).toHaveLength(100);
    expect(statuses.slice(100)).toEqual([429, 429]);
    expect((await request(app).post("/login").send({ email: "ok@example.com", password: "correct" })).status).toBe(429);
  });
});
