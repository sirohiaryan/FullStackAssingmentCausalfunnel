import { Router } from "express";
import Event from "../models/Event";
import Session from "../models/Session";

const router = Router();

type IncomingEvent = {
  sessionId?: string;
  session_id?: string;
  eventType?: "page_view" | "click";
  event_type?: "page_view" | "click";
  pageUrl?: string;
  page_url?: string;
  timestamp?: string | number | Date;
  x?: number;
  y?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  referrer?: string;
  userAgent?: string;
  path?: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function coerceDate(value: unknown): Date | null {
  if (!value) return new Date();
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.post("/events", async (req, res, next) => {
  try {
    const body = req.body as IncomingEvent;

    const sessionId = asString(body.sessionId ?? body.session_id);
    const eventType = body.eventType ?? body.event_type;
    const pageUrl = asString(body.pageUrl ?? body.page_url);
    const timestamp = coerceDate(body.timestamp);

    if (!sessionId) return res.status(400).json({ error: "session_id is required" });
    if (eventType !== "page_view" && eventType !== "click") {
      return res.status(400).json({ error: "event_type must be page_view or click" });
    }
    if (!pageUrl) return res.status(400).json({ error: "page_url is required" });
    if (!timestamp) return res.status(400).json({ error: "invalid timestamp" });

    const event = await Event.create({
      sessionId,
      eventType,
      pageUrl,
      timestamp,
      x: toNumber(body.x),
      y: toNumber(body.y),
      viewportWidth: toNumber(body.viewportWidth),
      viewportHeight: toNumber(body.viewportHeight),
      referrer: asString(body.referrer),
      userAgent: asString(body.userAgent),
      path: asString(body.path),
    });

    const inc = {
      totalEvents: 1,
      ...(eventType === "page_view" ? { pageViews: 1 } : {}),
      ...(eventType === "click" ? { clicks: 1 } : {}),
    };

    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          firstSeen: timestamp,
          firstPageUrl: pageUrl,
          userAgent: asString(body.userAgent),
          referrer: asString(body.referrer),
        },
        $set: {
          lastSeen: timestamp,
          lastPageUrl: pageUrl,
          lastEventType: eventType,
          ...(asString(body.userAgent) ? { userAgent: asString(body.userAgent) } : {}),
          ...(asString(body.referrer) ? { referrer: asString(body.referrer) } : {}),
        },
        $inc: inc,
      },
      { upsert: true, new: true }
    ).lean();

    res.status(201).json({ ok: true, event, session });
  } catch (error) {
    next(error);
  }
});

router.get("/overview", async (_req, res, next) => {
  try {
    const [sessions, totalEvents, pageViews, clicks, uniquePages] = await Promise.all([
      Session.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ eventType: "page_view" }),
      Event.countDocuments({ eventType: "click" }),
      Event.distinct("pageUrl"),
    ]);

    res.json({
      sessions,
      totalEvents,
      pageViews,
      clicks,
      uniquePages: uniquePages.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/sessions", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const sessions = await Session.find().sort({ lastSeen: -1 }).limit(limit).lean();
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

router.get("/sessions/:sessionId/events", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 }).lean();
    res.json({ sessionId, events });
  } catch (error) {
    next(error);
  }
});

router.get("/pages", async (_req, res, next) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: "$pageUrl",
          events: { $sum: 1 },
          clicks: {
            $sum: {
              $cond: [{ $eq: ["$eventType", "click"] }, 1, 0],
            },
          },
          sessions: { $addToSet: "$sessionId" },
          lastSeen: { $max: "$timestamp" },
        },
      },
      {
        $project: {
          _id: 0,
          pageUrl: "$_id",
          events: 1,
          clicks: 1,
          sessions: { $size: "$sessions" },
          lastSeen: 1,
        },
      },
      { $sort: { clicks: -1, events: -1, lastSeen: -1 } },
    ]);

    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

router.get("/heatmap", async (req, res, next) => {
  try {
    const pageUrl = asString(req.query.url);
    if (!pageUrl) return res.status(400).json({ error: "url query parameter is required" });

    const totalClicks = await Event.countDocuments({
      pageUrl,
      eventType: "click",
      x: { $ne: null },
      y: { $ne: null },
    });

    const uniqueSessions = await Event.distinct("sessionId", {
      pageUrl,
      eventType: "click",
      x: { $ne: null },
      y: { $ne: null },
    });

    const points = await Event.aggregate([
      {
        $match: {
          pageUrl,
          eventType: "click",
          x: { $ne: null },
          y: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            x: "$x",
            y: "$y",
            viewportWidth: "$viewportWidth",
            viewportHeight: "$viewportHeight",
          },
          count: { $sum: 1 },
          firstSeen: { $min: "$timestamp" },
          lastSeen: { $max: "$timestamp" },
        },
      },
      {
        $project: {
          _id: 0,
          x: "$_id.x",
          y: "$_id.y",
          viewportWidth: "$_id.viewportWidth",
          viewportHeight: "$_id.viewportHeight",
          count: 1,
          firstSeen: 1,
          lastSeen: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      pageUrl,
      totalClicks,
      uniqueSessions: uniqueSessions.length,
      points,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
