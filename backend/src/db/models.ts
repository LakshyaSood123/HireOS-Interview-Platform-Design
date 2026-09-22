import type { Model } from "mongoose";

import { RefreshToken } from "../modules/auth/refreshToken.model.js";
import { User } from "../modules/auth/user.model.js";
import { CurriculumSnapshot } from "../modules/curriculum/curriculum.model.js";
import { CourseProgress } from "../modules/learning/courseProgress.model.js";
import { LearningAttempt } from "../modules/learning/learningAttempt.model.js";
import { RewardEvent } from "../modules/learning/rewardEvent.model.js";
import { Note } from "../modules/notes/note.model.js";

/**
 * Every model, in one list, so `connect.ts` can build indexes on boot.
 * Each day appends here as its collections are added.
 */
export const models: Model<any>[] = [
  User,
  RefreshToken,
  CurriculumSnapshot,
  CourseProgress,
  RewardEvent,
  LearningAttempt,
  Note,
];
