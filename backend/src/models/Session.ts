import { Schema, model, InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true, index: true },
    totalEvents: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    firstPageUrl: { type: String, default: "" },
    lastPageUrl: { type: String, default: "" },
    lastEventType: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    referrer: { type: String, default: "" },
  },
  { versionKey: false }
);

sessionSchema.index({ lastSeen: -1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema>;
export default model("Session", sessionSchema);
