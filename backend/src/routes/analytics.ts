import { Router } from "express";
import Event from "../models/Event";
import Session from "../models/Session";

const router = Router();

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asDate(value: unknown): Date {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function asObject(value: unknown): Record<string, unknown> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function getLimit(value: unknown, fallback = 100, maximum = 500): number {
  const parsed = asNumber(value);

  if (parsed === null) return fallback;

  return Math.max(1, Math.min(Math.floor(parsed), maximum));
}

/*
  POST /api/events

  Receives:
  1. Automatic page-view events.
  2. Raw click events used by heatmaps.
  3. Structured funnel events such as:
     storefront_viewed
     category_filtered
     product_viewed
     wishlist_updated
     add_to_bag
     bag_quantity_changed
     bag_viewed
     payment_selected
     payment_unavailable
     delivery_selected
     inquiry_opened
     inquiry_submitted
     order_confirmed
*/
router.post("/events", async (req, res, next) => {
  try {
    const body = req.body ?? {};

    const sessionId = asString(body.sessionId);
    const eventType = asString(body.eventType);
    const pageUrl = asString(body.pageUrl);

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    if (eventType !== "page_view" && eventType !== "click") {
      return res.status(400).json({
        error: "eventType must be page_view or click",
      });
    }

    if (!pageUrl) {
      return res.status(400).json({
        error: "pageUrl is required",
      });
    }

    const timestamp = asDate(body.timestamp);
    const eventName = asString(body.eventName);
    const funnelEvent = asBoolean(body.funnelEvent);
    const properties = asObject(body.properties);

    const event = await Event.create({
      sessionId,
      eventType,
      eventName,
      funnelEvent,
      properties,

      pageUrl,
      path: asString(body.path),
      pageTitle: asString(body.pageTitle),
      timestamp,

      x: asNumber(body.x),
      y: asNumber(body.y),
      viewportWidth: asNumber(body.viewportWidth),
      viewportHeight: asNumber(body.viewportHeight),

      referrer: asString(body.referrer),
      userAgent: asString(body.userAgent),
    });

    const increment: Record<string, number> = {
      totalEvents: 1,
    };

    if (eventType === "page_view") {
      increment.pageViews = 1;
    }

    if (eventType === "click") {
      increment.clicks = 1;
    }

    await Session.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          firstSeen: timestamp,
          firstPageUrl: pageUrl,
        },

        $set: {
          lastSeen: timestamp,
          lastPageUrl: pageUrl,
          lastEventType: eventName || eventType,

          ...(asString(body.userAgent)
            ? { userAgent: asString(body.userAgent) }
            : {}),

          ...(asString(body.referrer)
            ? { referrer: asString(body.referrer) }
            : {}),
        },

        $inc: increment,
      },
      {
        upsert: true,
        new: true,
      }
    );

    return res.status(201).json({
      ok: true,
      eventId: event._id,
    });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/overview

  Dashboard headline metrics.
*/
router.get("/overview", async (_req, res, next) => {
  try {
    const [sessionCount, eventStats, uniquePages] = await Promise.all([
      Session.countDocuments({}),
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            pageViews: {
              $sum: {
                $cond: [{ $eq: ["$eventType", "page_view"] }, 1, 0],
              },
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ["$eventType", "click"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Event.distinct("pageUrl"),
    ]);

    const stats = eventStats[0] ?? {
      totalEvents: 0,
      pageViews: 0,
      clicks: 0,
    };

    return res.json({
      sessions: sessionCount,
      totalEvents: stats.totalEvents,
      pageViews: stats.pageViews,
      clicks: stats.clicks,
      uniquePages: uniquePages.length,
    });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/pages

  Page-level analytics for dashboard and heatmap page selector.
*/
router.get("/pages", async (_req, res, next) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: "$pageUrl",
          events: { $sum: 1 },

          pageViews: {
            $sum: {
              $cond: [{ $eq: ["$eventType", "page_view"] }, 1, 0],
            },
          },

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
          pageViews: 1,
          clicks: 1,
          sessions: { $size: "$sessions" },
          lastSeen: 1,
        },
      },
      {
        $sort: {
          pageViews: -1,
          events: -1,
        },
      },
    ]);

    return res.json({ pages });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/sessions?limit=100

  Recent visitor sessions for the session explorer.
*/
router.get("/sessions", async (req, res, next) => {
  try {
    const limit = getLimit(req.query.limit, 100, 500);

    const sessions = await Session.find({})
      .sort({ lastSeen: -1 })
      .limit(limit)
      .lean();

    return res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/sessions/:sessionId/events

  Ordered event journey for one anonymous visitor session.
*/
router.get("/sessions/:sessionId/events", async (req, res, next) => {
  try {
    const sessionId = asString(req.params.sessionId);

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1, _id: 1 })
      .limit(2000)
      .lean();

    return res.json({ events });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/heatmap?url=<pageUrl>

  Groups raw clicks by approximate coordinates.
  Structured funnel events are deliberately excluded.
*/
router.get("/heatmap", async (req, res, next) => {
  try {
    const pageUrl = asString(req.query.url) || asString(req.query.pageUrl);

    const filter: Record<string, unknown> = {
      eventType: "click",
      funnelEvent: false,
      x: { $ne: null },
      y: { $ne: null },
    };

    if (pageUrl) {
      filter.pageUrl = pageUrl;
    }

    const clicks = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(5000)
      .select("x y viewportWidth viewportHeight sessionId pageUrl")
      .lean();

    const pointMap = new Map<
      string,
      {
        x: number;
        y: number;
        viewportWidth: number | null;
        viewportHeight: number | null;
        count: number;
      }
    >();

    const sessions = new Set<string>();

    for (const click of clicks) {
      if (typeof click.x !== "number" || typeof click.y !== "number") {
        continue;
      }

      sessions.add(click.sessionId);

      // 24px buckets avoid rendering one dot per individual click.
      const bucketX = Math.round(click.x / 24) * 24;
      const bucketY = Math.round(click.y / 24) * 24;

      const key = `${bucketX}:${bucketY}:${click.viewportWidth ?? 0}:${
        click.viewportHeight ?? 0
      }`;

      const current = pointMap.get(key);

      if (current) {
        current.count += 1;
      } else {
        pointMap.set(key, {
          x: bucketX,
          y: bucketY,
          viewportWidth: click.viewportWidth ?? null,
          viewportHeight: click.viewportHeight ?? null,
          count: 1,
        });
      }
    }

    const points = Array.from(pointMap.values()).sort(
      (a, b) => b.count - a.count
    );

    return res.json({
      pageUrl,
      totalClicks: clicks.length,
      uniqueSessions: sessions.size,
      points,
    });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/funnel

  Funnel is session-based, not raw-event-based.
  A session counts once at each stage even if it repeats an action.
*/
router.get("/funnel", async (_req, res, next) => {
  try {
    const funnelSteps = [
      "storefront_viewed",
      "category_filtered",
      "product_viewed",
      "wishlist_updated",
      "add_to_bag",
      "bag_viewed",
      "payment_selected",
      "delivery_selected",
      "order_confirmed",
    ];

    const results = await Event.aggregate([
      {
        $match: {
          funnelEvent: true,
          eventName: { $in: funnelSteps },
        },
      },
      {
        $group: {
          _id: "$eventName",
          sessions: { $addToSet: "$sessionId" },
          eventCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          eventName: "$_id",
          sessionCount: { $size: "$sessions" },
          eventCount: 1,
        },
      },
    ]);

    const byName = new Map(
      results.map((item) => [
        item.eventName as string,
        {
          sessionCount: item.sessionCount as number,
          eventCount: item.eventCount as number,
        },
      ])
    );

    const funnel = funnelSteps.map((eventName) => ({
      eventName,
      sessionCount: byName.get(eventName)?.sessionCount ?? 0,
      eventCount: byName.get(eventName)?.eventCount ?? 0,
    }));

    return res.json({ funnel });
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/events?limit=100

  Recent event stream. Useful for debugging and dashboard activity feed.
*/
router.get("/events", async (req, res, next) => {
  try {
    const limit = getLimit(req.query.limit, 100, 500);

    const events = await Event.find({})
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit)
      .lean();

    return res.json({ events });
  } catch (error) {
    next(error);
  }
});

export default router;