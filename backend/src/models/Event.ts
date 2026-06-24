import { Schema, model, InferSchemaType } from "mongoose";

const eventSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ["page_view", "click"],
      index: true,
    },
    pageUrl: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    x: { type: Number, default: null },
    y: { type: Number, default: null },
    viewportWidth: { type: Number, default: null },
    viewportHeight: { type: Number, default: null },
    referrer: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    path: { type: String, default: "" },
  },
  { versionKey: false }
);

eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ pageUrl: 1, eventType: 1, timestamp: 1 });

export type EventDoc = InferSchemaType<typeof eventSchema>;
export default model("Event", eventSchema);
