/**
 * Promotes an EXISTING account to the CMS "admin" role. This is the supported way to create the first
 * administrator: public registration always creates learners and ignores any role in the request.
 *
 *   1. register the account normally (through the app or POST /auth/register)
 *   2. npx tsx scripts/promoteAdmin.ts --email=<that account's email>
 *
 * No password is read, printed or stored by this script.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";

const email = process.argv.find((a) => a.startsWith("--email="))?.slice(8).trim().toLowerCase();

async function main() {
  if (!email) throw new Error("--email=<registered account email> is required");
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error(`no account with that email in database "${env.MONGO_DB_NAME}"; register it first`);
    if (user.role === "admin") {
      console.log(`already an admin: ${email} (database ${env.MONGO_DB_NAME})`);
      return;
    }
    user.role = "admin";
    await user.save();
    console.log(`PROMOTED ${email} -> admin (database ${env.MONGO_DB_NAME})`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error("[promote-admin] STOPPED:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
