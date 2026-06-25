"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type Overview = {
  sessions: number;
  totalEvents: number;
  pageViews: number;
  clicks: number;
  uniquePages: number;
};

type SessionRow = {
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

type EventRow = {
  _id?: string;
  sessionId: string;
  eventType: "page_view" | "click";
  eventName?: string;
  funnelEvent?: boolean;
  properties?: Record<string, unknown>;
  pageUrl: string;
  timestamp: string;
  x?: number | null;
  y?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  referrer?: string;
  userAgent?: string;
  path?: string;
};

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
}

function shortSessionId(sessionId: string) {
  if (sessionId.length <= 18) {
    return sessionId;
  }

  return `${sessionId.slice(0, 10)}…${sessionId.slice(-6)}`;
}

function eventLabel(event: EventRow) {
  if (event.funnelEvent && event.eventName) {
    return event.eventName.replaceAll("_", " ");
  }

  if (event.eventName === "raw_click") {
    return "raw click";
  }

  return event.eventType.replaceAll("_", " ");
}

function formatProperties(properties?: Record<string, unknown>) {
  if (!properties || Object.keys(properties).length === 0) {
    return "";
  }

  return Object.entries(properties)
    .slice(0, 5)
    .map(([key, value]) => {
      const rendered =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

      return `${key}: ${rendered}`;
    })
    .join(" · ");
}

export default function SessionsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState("");

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const [overviewData, sessionData] = await Promise.all([
        apiGet<Overview>("/api/overview"),
        apiGet<{ sessions: SessionRow[] }>("/api/sessions?limit=100"),
      ]);

      setOverview(overviewData);
      setSessions(sessionData.sessions);

      setSelectedSessionId((current) => {
        const stillExists = sessionData.sessions.some(
          (session) => session.sessionId === current
        );

        if (current && stillExists) {
          return current;
        }

        return sessionData.sessions[0]?.sessionId ?? "";
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load session analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      setEvents([]);
      return;
    }

    async function loadJourney() {
      setLoadingEvents(true);

      try {
        const data = await apiGet<{ events: EventRow[] }>(
          `/api/sessions/${encodeURIComponent(selectedSessionId)}/events`
        );

        setEvents(data.events);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the selected visitor journey."
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    loadJourney();
  }, [selectedSessionId]);

  const filteredSessions = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return sessions;
    }

    return sessions.filter((session) =>
      [
        session.sessionId,
        session.firstPageUrl,
        session.lastPageUrl,
        session.userAgent,
        session.referrer,
        session.lastEventType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [sessions, query]);

  const selectedSession =
    sessions.find((session) => session.sessionId === selectedSessionId) ?? null;

  const funnelEvents = events.filter((event) => event.funnelEvent);
  const rawClicks = events.filter(
    (event) => event.eventType === "click" && !event.funnelEvent
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <div className="eyebrow">VISITOR INTELLIGENCE</div>
          <h1>Sessions and customer journeys</h1>
          <p>
            Inspect anonymous visitor paths from storefront entry through product
            discovery, bag actions, payment selection, delivery selection, and
            final order confirmation.
          </p>
        </div>

        <button className="refresh-button" onClick={loadSessions}>
          Refresh data
        </button>
      </section>

      {error && (
        <div className="error-card">
          <strong>Analytics request failed</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Tracked sessions</span>
          <strong>{overview?.sessions ?? "—"}</strong>
          <small>Anonymous visitor sessions stored by the collector</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Captured events</span>
          <strong>{overview?.totalEvents ?? "—"}</strong>
          <small>Raw clicks, page views, and structured funnel events</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Page views</span>
          <strong>{overview?.pageViews ?? "—"}</strong>
          <small>Tracked storefront page loads</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Unique pages</span>
          <strong>{overview?.uniquePages ?? "—"}</strong>
          <small>Distinct URLs observed in visitor journeys</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">SESSION DIRECTORY</div>
              <h2>Recent visitor sessions</h2>
            </div>

            <span className="panel-note">
              {filteredSessions.length} of {sessions.length} shown
            </span>
          </div>

          <div className="toolbar">
            <input
              className="input"
              placeholder="Search session ID, URL, referrer, browser..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty">Loading sessions…</div>
          ) : filteredSessions.length === 0 ? (
            <div className="empty">
              No sessions match this search. Open the demo store and interact with
              it to create a tracked journey.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Activity</th>
                    <th>Entry page</th>
                    <th>Last seen</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map((session) => {
                    const active = session.sessionId === selectedSessionId;

                    return (
                      <tr
                        key={session.sessionId}
                        style={{
                          background: active
                            ? "rgba(108, 124, 255, 0.08)"
                            : "transparent",
                        }}
                      >
                        <td>
                          <button
                            className="row-btn"
                            onClick={() => setSelectedSessionId(session.sessionId)}
                          >
                            <div className="code">
                              {shortSessionId(session.sessionId)}
                            </div>

                            <div
                              className="muted"
                              style={{ fontSize: 11, marginTop: 6 }}
                            >
                              {session.referrer || "Direct / no referrer"}
                            </div>
                          </button>
                        </td>

                        <td>
                          <strong style={{ fontSize: 13 }}>
                            {session.totalEvents} events
                          </strong>

                          <div
                            className="muted"
                            style={{ fontSize: 11, marginTop: 6 }}
                          >
                            {session.pageViews} views · {session.clicks} clicks
                          </div>
                        </td>

                        <td>
                          <div
                            className="code"
                            style={{ maxWidth: 230 }}
                            title={session.firstPageUrl}
                          >
                            {session.firstPageUrl || "—"}
                          </div>
                        </td>

                        <td className="muted" style={{ fontSize: 12 }}>
                          {formatDate(session.lastSeen)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">JOURNEY INSPECTOR</div>
              <h2>Selected visitor path</h2>
            </div>

            {selectedSession && (
              <span className="panel-note">
                {selectedSession.totalEvents} events
              </span>
            )}
          </div>

          {!selectedSession ? (
            <div className="empty">
              Select a session to inspect its ordered events.
            </div>
          ) : (
            <>
              <div className="coverage-list" style={{ marginBottom: 18 }}>
                <div>
                  <strong>Session ID</strong>
                  <span className="code">{selectedSession.sessionId}</span>
                </div>

                <div>
                  <strong>Entry page</strong>
                  <span className="code">{selectedSession.firstPageUrl || "—"}</span>
                </div>

                <div>
                  <strong>Last page</strong>
                  <span className="code">{selectedSession.lastPageUrl || "—"}</span>
                </div>

                <div>
                  <strong>Referrer</strong>
                  <span>{selectedSession.referrer || "Direct / unknown"}</span>
                </div>

                <div>
                  <strong>Device / browser</strong>
                  <span>{selectedSession.userAgent || "Not recorded"}</span>
                </div>
              </div>

              <div className="subgrid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
                <article className="card">
                  <div className="metric-label">Funnel events</div>
                  <div className="stat">{funnelEvents.length}</div>
                </article>

                <article className="card">
                  <div className="metric-label">Raw clicks</div>
                  <div className="stat">{rawClicks.length}</div>
                </article>
              </div>

              <div style={{ marginTop: 20 }}>
                <div className="eyebrow">ORDERED EVENT STREAM</div>

                <div className="timeline">
                  {loadingEvents ? (
                    <div className="empty">Loading visitor journey…</div>
                  ) : events.length === 0 ? (
                    <div className="empty">
                      No events were found for this session.
                    </div>
                  ) : (
                    events.map((event, index) => {
                      const properties = formatProperties(event.properties);

                      return (
                        <article
                          className="timeline-item"
                          key={`${event.timestamp}-${event._id ?? index}`}
                        >
                          <div className="timeline-top">
                            <span
                              className={
                                event.funnelEvent
                                  ? "badge page_view"
                                  : event.eventType === "click"
                                    ? "badge click"
                                    : "badge page_view"
                              }
                            >
                              {eventLabel(event)}
                            </span>

                            <span className="muted" style={{ fontSize: 10 }}>
                              {formatDate(event.timestamp)}
                            </span>
                          </div>

                          <div className="code" title={event.pageUrl}>
                            {event.pageUrl}
                          </div>

                          {properties && (
                            <div
                              className="muted"
                              style={{
                                fontSize: 11,
                                lineHeight: 1.55,
                                marginTop: 8,
                              }}
                            >
                              {properties}
                            </div>
                          )}

                          {!event.funnelEvent && event.eventType === "click" && (
                            <div
                              className="muted"
                              style={{
                                fontSize: 11,
                                lineHeight: 1.55,
                                marginTop: 8,
                              }}
                            >
                              Click coordinate: {event.x ?? "—"}, {event.y ?? "—"}
                              {" · "}
                              Viewport: {event.viewportWidth ?? "—"} ×{" "}
                              {event.viewportHeight ?? "—"}
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}