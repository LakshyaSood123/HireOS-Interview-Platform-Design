import { Router, type Request } from "express";

import { currentUserId, requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { body, validate } from "../../middleware/validate.js";
import { sendData } from "../../shared/envelope.js";
import * as authService from "./auth.service.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type LogoutInput,
  type RefreshInput,
  type RegisterInput,
} from "./auth.schema.js";

function sessionContext(req: Request): authService.SessionContext {
  return { userAgent: req.header("user-agent") ?? null, ip: req.ip ?? null };
}

export const authRouter = Router();

authRouter.post(
  "/auth/register",
  authRateLimit,
  validate({ body: registerSchema }),
  async (req, res) => {
    const result = await authService.register(body<RegisterInput>(req), sessionContext(req));
    sendData(res, result, 201);
  },
);

authRouter.post("/auth/login", authRateLimit, validate({ body: loginSchema }), async (req, res) => {
  const result = await authService.login(body<LoginInput>(req), sessionContext(req));
  sendData(res, result);
});

authRouter.post("/auth/refresh", validate({ body: refreshSchema }), async (req, res) => {
  const { refreshToken } = body<RefreshInput>(req);
  const result = await authService.refresh(refreshToken, sessionContext(req));
  sendData(res, result);
});

authRouter.post("/auth/logout", requireAuth, validate({ body: logoutSchema }), async (req, res) => {
  const { refreshToken } = body<LogoutInput>(req);
  await authService.logout(refreshToken, currentUserId(req));
  res.status(204).end();
});

authRouter.get("/users/me", requireAuth, async (req, res) => {
  // Identity comes from the verified token — never from the request body.
  const user = await authService.getProfile(currentUserId(req));
  sendData(res, user);
});
