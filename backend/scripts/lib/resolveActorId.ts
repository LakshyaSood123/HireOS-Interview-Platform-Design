/**
 * Shared between `bootstrapDsaCms.ts` (real use) and
 * `verifyBootstrapAtomicity.ts` (proves the rejection behavior) so the rule
 * is defined once: a REAL (non-dry-run) bootstrap must be attributable to a
 * real admin account — never a synthetic id (Phase 3B hardening plan §2).
 */

import { User } from "../../src/modules/auth/user.model.js";

export async function resolveActorId(adminEmail: string | undefined): Promise<string> {
  if (adminEmail) {
    const user = await User.findOne({ email: adminEmail.toLowerCase() }).lean();
    if (!user) {
      throw new Error(`resolveActorId: no user found with email "${adminEmail}". Register the account first, then promote it to "admin".`);
    }
    if (user.role !== "admin") {
      throw new Error(`resolveActorId: user "${adminEmail}" is not an admin (role: "${user.role}"). Promote it to "admin" first.`);
    }
    return user._id.toString();
  }

  const anyAdmin = await User.findOne({ role: "admin" }).lean();
  if (anyAdmin) return anyAdmin._id.toString();

  throw new Error(
    'resolveActorId: no admin user exists. Register an account and promote it to "admin" ' +
      "(or pass --admin-email=<an existing admin's email>) before running a real (non-dry-run) bootstrap. " +
      "Use --dry-run to preview the mapped content without needing an admin.",
  );
}
