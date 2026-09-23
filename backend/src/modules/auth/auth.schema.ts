import { z } from "zod";

/** Request shapes for the auth endpoints — mirrors docs/openapi.yaml. */

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email address is required.").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  displayName: z.string().trim().min(1, "Display name is required.").max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email address is required.").max(254),
  password: z.string().min(1, "Password is required.").max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required."),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
