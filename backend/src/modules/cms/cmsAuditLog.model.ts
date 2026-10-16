import { model, Schema, type InferSchemaType } from "mongoose";

/**
 * `cmsAuditLog` — a minimal, append-only record of destructive CMS actions (today: permanent course deletion).
 * It keeps ids, the title and counts only. It never stores course content, a password, a password hash or a token.
 */
const cmsAuditLogSchema = new Schema(
  {
    action: { type: String, required: true, enum: ["COURSE_PERMANENTLY_DELETED"] },
    courseId: { type: String, required: true },
    courseTitle: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, required: true },
    counts: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: false, collection: "cmsAuditLog" },
);
cmsAuditLogSchema.index({ courseId: 1, deletedAt: -1 });

export type CmsAuditLogAttributes = InferSchemaType<typeof cmsAuditLogSchema>;
export const CmsAuditLog = model("CmsAuditLog", cmsAuditLogSchema);
