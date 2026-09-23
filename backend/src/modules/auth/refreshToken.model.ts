import { model, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";

/**
 * One row per issued refresh token. The raw token is never stored — only its
 * SHA-256 hash — so a database dump cannot be replayed as a login.
 *
 * `expiresAt` carries a TTL index, so expired sessions delete themselves.
 */
const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    /** Set when this token was rotated, so a replayed token can be recognised. */
    replacedByTokenHash: { type: String, default: null },
    userAgent: { type: String, default: null, maxlength: 512 },
    ip: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true, collection: "refreshTokens" },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenAttributes = InferSchemaType<typeof refreshTokenSchema>;
export type RefreshTokenDocument = HydratedDocument<RefreshTokenAttributes>;

export const RefreshToken = model("RefreshToken", refreshTokenSchema);
