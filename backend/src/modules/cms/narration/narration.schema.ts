import { z } from "zod";

export const narrationGenerateSchema = z.object({
  mode: z.enum(["missing", "stale", "missing-and-stale", "step"]),
  stepId: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,64}$/).optional(),
  force: z.boolean().optional(),
});
export type NarrationGenerateInput = z.infer<typeof narrationGenerateSchema>;

export const courseNarrationGenerateSchema = z.object({
  mode: z.enum(["missing", "stale", "missing-and-stale"]),
  force: z.boolean().optional(),
});
export type CourseNarrationGenerateInput = z.infer<typeof courseNarrationGenerateSchema>;

export const narrationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  defaults: z.object({ voice: z.string().trim().min(1).max(60).optional(), language: z.string().trim().min(2).max(16).optional(), speed: z.number().min(0.25).max(4).optional() }).optional(),
  steps: z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/), z.object({ enabled: z.boolean().optional() })).optional(),
});
export type NarrationSettingsInput = z.infer<typeof narrationSettingsSchema>;

export const narrationOverviewQuery = z.object({ revisionId: z.string().trim().min(1).max(32).optional() });
export const narrationAudioParams = z.object({
  packageId: z.string().trim().min(1).max(64),
  revisionId: z.string().trim().min(1).max(32),
  stepId: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,64}$/),
});
export type NarrationAudioParams = z.infer<typeof narrationAudioParams>;
