"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type P = {
  pageUrl: string;
  events: number;
  clicks: number;
  sessions: number;
};

type Point = {
  x: number;
  y: number;
  viewportWidth: number | null;
  viewportHeight: number | null;
  count: number;
};

type H = {
  pageUrl: string;
  totalClicks: number;
  uniqueSessions: number;
  points: Point[];
};

export default function Heatmap() {
  const [pages, setPages] = useState<P[]>([]);
  const [url, setUrl] = useState("");
  const [data, setData] = useState<H | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiGet<{ pages: P[] }>("/api/pages")
      .then((response) => {
        setPages(response.pages);
        setUrl(response.pages[0]?.pageUrl || "");
      })
      .catch(() => setErr("Cannot load tracked pages."));
  }, []);

  useEffect(() => {
    if (!url) return;

    apiGet<H>("/api/heatmap?url=" + encodeURIComponent(url))
      .then(setData)
      .catch(() => setErr("Cannot load heatmap data."));
  }, [url]);

  const max = useMemo(
    () => Math.max(1, ...(data?.points.map((point) => point.count) || [1])),
    [data]
  );

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">CLICK ANALYSIS</span>
          <h2>Page heatmap</h2>
          <p>Normalized click coordinates from tracked sessions.</p>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="heat-toolbar">
        <label>
          Tracked page
          <select value={url} onChange={(event) => setUrl(event.target.value)}>
            {pages.map((page) => (
              <option key={page.pageUrl} value={page.pageUrl}>
                {page.pageUrl}
              </option>
            ))}
          </select>
        </label>

        <div className="heat-stats">
          <span>
            Clicks <b>{data?.totalClicks ?? 0}</b>
          </span>
          <span>
            Sessions <b>{data?.uniqueSessions ?? 0}</b>
          </span>
          <span>
            Clusters <b>{data?.points.length ?? 0}</b>
          </span>
        </div>
      </div>

      <section className="surface heat-surface">
        <div className="store-preview">
          <div className="preview-nav">
            <b>northstar</b>
            <span>Shop · New arrivals · Collections</span>
            <button>Bag (0)</button>
          </div>

          <div className="preview-hero">
            <small>SPRING / SUMMER</small>
            <h3>
              Objects for
              <br />
              everyday use.
            </h3>
            <button>Shop collection</button>
          </div>

          <div className="preview-products">
            <i />
            <i />
            <i />
          </div>

          {data?.points.map((point, index) => {
            const left = Math.min(
              99,
              Math.max(1, (point.x / (point.viewportWidth || 1440)) * 100)
            );

            const top = Math.min(
              99,
              Math.max(1, (point.y / (point.viewportHeight || 900)) * 100)
            );

            const size = 16 + (32 * point.count) / max;

            return (
              <span
                key={index}
                className="heat-dot"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: size,
                  height: size,
                  opacity: 0.35 + (0.55 * point.count) / max,
                }}
                title={`${point.count} clicks`}
              />
            );
          })}
        </div>

        {!data?.points.length && (
          <div className="empty">
            No click points yet. Open the demo store, interact with it, then
            return here.
          </div>
        )}
      </section>
    </>
  );
}