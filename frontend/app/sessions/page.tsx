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

function fmt(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export default function SessionsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, s] = await Promise.all([
          apiGet<Overview>("/api/overview"),
          apiGet<{ sessions: SessionRow[] }>("/api/sessions?limit=100"),
        ]);

        setOverview(o);
        setSessions(s.sessions);
        setSelectedSessionId(s.sessions[0]?.sessionId ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      setEvents([]);
      return;
    }

    (async () => {
      setLoadingEvents(true);
      try {
        const data = await apiGet<{ events: EventRow[] }>(
          `/api/sessions/${encodeURIComponent(selectedSessionId)}/events`
        );
        setEvents(data.events);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [selectedSessionId]);

  const filteredSessions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sessions;
    return sessions.filter((s) =>
      [
        s.sessionId,
        s.firstPageUrl,
        s.lastPageUrl,
        s.userAgent,
        s.referrer,
        s.lastEventType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [sessions, query]);

  const selected = filteredSessions.find((s) => s.sessionId === selectedSessionId) || filteredSessions[0] || null;

  useEffect(() => {
    if (!selectedSessionId && filteredSessions[0]) {
      setSelectedSessionId(filteredSessions[0].sessionId);
    }
  }, [filteredSessions, selectedSessionId]);

  return (
    <div className="hero">
      <div className="kicker">Dashboard · sessions view</div>
      <h1 className="h1">Visitor sessions and ordered journeys</h1>
      <p className="muted" style={{ maxWidth: 780, lineHeight: 1.7 }}>
        Every row is an anonymous session. Click one to inspect the exact event sequence.
      </p>

      <div className="subgrid">
        <div className="card">
          <div className="muted">Sessions</div>
          <div className="stat">{overview?.sessions ?? "—"}</div>
        </div>
        <div className="card">
          <div className="muted">Events</div>
          <div className="stat">{overview?.totalEvents ?? "—"}</div>
        </div>
        <div className="card">
          <div className="muted">Page views</div>
          <div className="stat">{overview?.pageViews ?? "—"}</div>
        </div>
        <div className="card">
          <div className="muted">Unique pages</div>
          <div className="stat">{overview?.uniquePages ?? "—"}</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by session id, URL, referrer, user agent..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="muted">{filteredSessions.length} visible sessions</div>
      </div>

      <div className="layout-2col">
        <section className="panel">
          <h2>Sessions</h2>
          {loading ? (
            <div className="empty">Loading sessions…</div>
          ) : filteredSessions.length === 0 ? (
            <div className="empty">No sessions found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Events</th>
                    <th>Views</th>
                    <th>Clicks</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      style={{
                        background:
                          session.sessionId === selected?.sessionId ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      }}
                    >
                      <td>
                        <button className="row-btn" onClick={() => setSelectedSessionId(session.sessionId)}>
                          <div className="code">{session.sessionId}</div>
                          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                            {session.firstPageUrl || "—"}
                          </div>
                        </button>
                      </td>
                      <td>{session.totalEvents}</td>
                      <td>{session.pageViews}</td>
                      <td>{session.clicks}</td>
                      <td>{fmt(session.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Selected journey</h2>
          {selected ? (
            <>
              <div className="muted" style={{ lineHeight: 1.7 }}>
                <div>
                  <strong>Session:</strong> <span className="code">{selected.sessionId}</span>
                </div>
                <div>
                  <strong>Entry:</strong> {selected.firstPageUrl || "—"}
                </div>
                <div>
                  <strong>Exit:</strong> {selected.lastPageUrl || "—"}
                </div>
                <div>
                  <strong>Referrer:</strong> {selected.referrer || "—"}
                </div>
              </div>

              <div className="timeline">
                {loadingEvents ? (
                  <div className="empty">Loading journey…</div>
                ) : events.length === 0 ? (
                  <div className="empty">No events for this session.</div>
                ) : (
                  events.map((event, index) => (
                    <div className="timeline-item" key={`${event.timestamp}-${index}`}>
                      <div className="timeline-top">
                        <span className={`badge ${event.eventType}`}>{event.eventType}</span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {fmt(event.timestamp)}
                        </span>
                      </div>
                      <div className="code">{event.pageUrl}</div>
                      <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                        {event.eventType === "click"
                          ? `x=${event.x ?? "-"} · y=${event.y ?? "-"} · viewport=${event.viewportWidth ?? "-"}×${event.viewportHeight ?? "-"}`
                          : "page_view"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="empty">Pick a session to inspect its ordered events.</div>
          )}
        </section>
      </div>
    </div>
  );
}
