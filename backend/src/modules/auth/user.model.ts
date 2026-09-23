import { model, Schema, type HydratedDocument, type InferSchemaType, type Types } from "mongoose";

export const USER_ROLES = ["learner", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // `select: false` so a stray `User.findById()` can never carry the hash
    // into a response or a log line. Reads that need it ask explicitly.
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: USER_ROLES, default: "learner", required: true },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type UserAttributes = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttributes>;

export const User = model("User", userSchema);

/** The only shape of a user that ever leaves the API. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export function toPublicUser(user: {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  role: string;
  createdAt?: Date;
}): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role as UserRole,
    createdAt: (user.createdAt ?? new Date()).toISOString(),
  };
}
