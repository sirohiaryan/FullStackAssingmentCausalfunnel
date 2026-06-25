export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type QueryValue = string | number | boolean | null | undefined;

function buildUrl(
  path: string,
  query?: Record<string, QueryValue>
): string {
  const url = new URL(path, API_BASE);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, QueryValue>
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;

    try {
      const body = (await response.json()) as {
        error?: string;
        message?: string;
      };

      message = body.message || body.error || message;
    } catch {
      // Keep the standard HTTP error message if response is not JSON.
    }

    throw new Error(`API request failed: ${message}`);
  }

  return (await response.json()) as T;
}

export type FunnelStep = {
  eventName: string;
  sessionCount: number;
  eventCount: number;
};

export type FunnelResponse = {
  funnel: FunnelStep[];
};

export type Overview = {
  sessions: number;
  totalEvents: number;
  pageViews: number;
  clicks: number;
  uniquePages: number;
};

export type PageRow = {
  pageUrl: string;
  events: number;
  pageViews: number;
  clicks: number;
  sessions?: number;
  lastSeen?: string;
};

export type SessionRow = {
  _id?: string;
  sessionId: string;
  firstSeen: string;
  lastSeen: string;
  totalEvents: number;
  pageViews: number;
  clicks: number;
  firstPageUrl: string;
  lastPageUrl: string;
  lastEventType: string;
  userAgent: string;
  referrer: string;
};

export type EventRow = {
  _id?: string;
  sessionId: string;
  eventType: "page_view" | "click";
  eventName?: string;
  funnelEvent?: boolean;
  properties?: Record<string, unknown>;
  pageUrl: string;
  path?: string;
  pageTitle?: string;
  timestamp: string;
  x?: number | null;
  y?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  referrer?: string;
  userAgent?: string;
};

export type HeatmapPoint = {
  x: number;
  y: number;
  viewportWidth: number | null;
  viewportHeight: number | null;
  count: number;
};

export type HeatmapResponse = {
  pageUrl: string;
  totalClicks: number;
  uniqueSessions: number;
  points: HeatmapPoint[];
};

export function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function readableEventName(eventName?: string): string {
  if (!eventName) return "Unknown event";

  return eventName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}