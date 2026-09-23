import { randomBytes } from "node:crypto";

import { compare, hash } from "bcryptjs";
import type { Types } from "mongoose";

import { env } from "../../config/env.js";
import { ApiError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";
import { RefreshToken } from "./refreshToken.model.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js";
import { toPublicUser, User, type PublicUser, type UserRole } from "./user.model.js";

export interface SessionContext {
  userAgent?: string | null;
  ip?: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

const DUPLICATE_KEY = 11_000;

/**
 * Compared against when an email is unknown, so a wrong email and a wrong
 * password take the same time to answer. Built once, lazily.
 */
let dummyHash: Promise<string> | null = null;
function unmatchableHash(): Promise<string> {
  dummyHash ??= hash(randomBytes(24).toString("hex"), env.BCRYPT_ROUNDS);
  return dummyHash;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === DUPLICATE_KEY;
}

async function issueSession(
  userId: string,
  role: UserRole,
  user: PublicUser,
  context: SessionContext,
): Promise<AuthResult> {
  const access = signAccessToken(userId, role);
  const refresh = signRefreshToken(userId);

  await RefreshToken.create({
    userId,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
    userAgent: context.userAgent ?? null,
    ip: context.ip ?? null,
  });

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    expiresIn: access.expiresIn,
    user,
  };
}

export async function register(
  input: { email: string; password: string; displayName: string },
  context: SessionContext = {},
): Promise<AuthResult> {
  const passwordHash = await hash(input.password, env.BCRYPT_ROUNDS);

  try {
    const created = await User.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      role: "learner",
    });

    const user = toPublicUser(created);
    logger.info({ userId: user.id }, "auth: registered");

    return await issueSession(user.id, user.role, user, context);
  } catch (error) {
    // The unique index on `email` is the authority here, not a prior read —
    // a read-then-write would let two concurrent registrations both pass.
    if (isDuplicateKeyError(error)) {
      throw new ApiError("EMAIL_ALREADY_REGISTERED", "That email address is already registered.");
    }
    throw error;
  }
}

export async function login(
  input: { email: string; password: string },
  context: SessionContext = {},
): Promise<AuthResult> {
  const found = await User.findOne({ email: input.email }).select("+passwordHash").lean();

  if (!found) {
    await compare(input.password, await unmatchableHash());
    throw ApiError.unauthenticated("Invalid email or password.");
  }

  const matches = await compare(input.password, found.passwordHash);
  if (!matches) {
    // Deliberately the same message as an unknown email: the response never
    // reveals which of the two fields was wrong.
    throw ApiError.unauthenticated("Invalid email or password.");
  }

  const user = toPublicUser({ ...found, _id: found._id as Types.ObjectId });
  logger.info({ userId: user.id }, "auth: logged in");

  return issueSession(user.id, user.role, user, context);
}

/**
 * Rotates a refresh token: the presented token is revoked in the same atomic
 * write that claims it, so two concurrent refreshes cannot both succeed.
 *
 * A token presented after it was already revoked is treated as theft — every
 * live session for that user is revoked.
 */
export async function refresh(rawToken: string, context: SessionContext = {}): Promise<AuthResult> {
  const payload = verifyRefreshToken(rawToken);
  const tokenHash = hashToken(rawToken);
  const next = signRefreshToken(payload.sub);

  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date(), replacedByTokenHash: next.tokenHash } },
  ).lean();

  if (!claimed) {
    const existing = await RefreshToken.findOne({ tokenHash }).lean();

    if (existing?.revokedAt) {
      await RefreshToken.updateMany(
        { userId: existing.userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      logger.warn({ userId: existing.userId.toString() }, "auth: refresh token reuse — all sessions revoked");
    }

    throw ApiError.unauthenticated("Invalid or expired refresh token.");
  }

  const found = await User.findById(payload.sub).lean();
  if (!found) throw ApiError.unauthenticated("Invalid or expired refresh token.");

  const user = toPublicUser({ ...found, _id: found._id as Types.ObjectId });
  const access = signAccessToken(user.id, user.role);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: next.tokenHash,
    expiresAt: next.expiresAt,
    userAgent: context.userAgent ?? null,
    ip: context.ip ?? null,
  });

  return {
    accessToken: access.token,
    refreshToken: next.token,
    expiresIn: access.expiresIn,
    user,
  };
}

/** Revokes one refresh token. Repeating it is harmless. */
export async function logout(rawToken: string, userId: string): Promise<void> {
  const payload = verifyRefreshToken(rawToken);

  if (payload.sub !== userId) {
    throw ApiError.forbidden("That refresh token belongs to another session.");
  }

  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  logger.info({ userId }, "auth: logged out");
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const found = await User.findById(userId).lean();
  if (!found) throw ApiError.unauthenticated("Invalid or expired token.");

  return toPublicUser({ ...found, _id: found._id as Types.ObjectId });
}
