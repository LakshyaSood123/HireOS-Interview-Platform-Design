import type { Model } from "mongoose";

import { RefreshToken } from "../modules/auth/refreshToken.model.js";
import { User } from "../modules/auth/user.model.js";

/**
 * Every model, in one list, so `connect.ts` can build indexes on boot.
 * Day 2 onwards appends here as collections are added.
 */
export const models: Model<any>[] = [User, RefreshToken];
