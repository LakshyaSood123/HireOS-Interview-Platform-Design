import { createHash, randomBytes, randomUUID } from "node:crypto";

import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { ApiError } from "../../shared/errors.js";
import type { UserRole } from "./user.model.js";

const ISSUER = "reagvis-trails-api";
const AUDIENCE = "reagvis-trails";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  typ: "access";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  typ: "refresh";
  iat: number;
  exp: number;
}

/** The refresh token is only ever stored as this hash — never in the clear. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function signAccessToken(userId: string, role: UserRole): { token: string; expiresIn: number } {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    issuer: ISSUER,
    audience: AUDIENCE,
  };

  const token = jwt.sign({ sub: userId, role, typ: "access" }, env.JWT_ACCESS_SECRET, options);
  const decoded = jwt.decode(token) as { iat: number; exp: number };

  return { token, expiresIn: decoded.exp - decoded.iat };
}

export interface IssuedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function signRefreshToken(userId: string): IssuedRefreshToken {
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    // `jti` and the random nonce make every issued token unique, so rotation
    // always produces a genuinely new value even within the same second.
    { sub: userId, jti: randomUUID(), typ: "refresh", nonce: randomBytes(16).toString("hex") },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`, issuer: ISSUER, audience: AUDIENCE },
  );

  return { token, tokenHash: hashToken(token), expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as AccessTokenPayload;

    if (payload.typ !== "access") {
      throw ApiError.unauthenticated("Invalid or expired token.");
    }

    return payload;
  } catch {
    // Expired, tampered, wrong secret and wrong type all read the same to a
    // client — nothing here hints at which one it was.
    throw ApiError.unauthenticated("Invalid or expired token.");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as RefreshTokenPayload;

    if (payload.typ !== "refresh") {
      throw ApiError.unauthenticated("Invalid or expired refresh token.");
    }

    return payload;
  } catch {
    throw ApiError.unauthenticated("Invalid or expired refresh token.");
  }
}
