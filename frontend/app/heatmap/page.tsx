"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type Page = {
  pageUrl: string;
  events: number;
  pageViews: number;
  clicks: number;
  sessions: number;
  lastSeen?: string;
};

type HeatPoint = {
  x: number;
  y: number;
  viewportWidth: number | null;
  viewportHeight: number | null;
  count: number;
};

type HeatmapResponse = {
  pageUrl: string;
  totalClicks: number;
  uniqueSessions: number;
  points: HeatPoint[];
};

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function heatStrength(count: number, maxCount: number) {
  if (maxCount <= 1) return 1;
  return 0.25 + (count / maxCount) * 0.75;
}

export default function HeatmapPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageUrl, setSelectedPageUrl] = useState("");
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [error, setError] = useState("");

  async function loadPages() {
    setLoadingPages(true);
    setError("");

    try {
      const data = await apiGet<{ pages: Page[] }>("/api/pages");

      setPages(data.pages);

      setSelectedPageUrl((current) => {
        const pageStillExists = data.pages.some(
          (page) => page.pageUrl === current
        );

        if (current && pageStillExists) {
          return current;
        }

        return data.pages[0]?.pageUrl ?? "";
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load tracked pages."
      );
    } finally {
      setLoadingPages(false);
    }
  }

  async function loadHeatmap(pageUrl: string) {
    if (!pageUrl) {
      setHeatmap(null);
      return;
    }

    setLoadingHeatmap(true);
    setError("");

    try {
      const data = await apiGet<HeatmapResponse>(
        `/api/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`
      );

      setHeatmap(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load click heatmap data."
      );
    } finally {
      setLoadingHeatmap(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    loadHeatmap(selectedPageUrl);
  }, [selectedPageUrl]);

  const maxCount = useMemo(() => {
    if (!heatmap?.points.length) return 1;

    return Math.max(...heatmap.points.map((point) => point.count));
  }, [heatmap]);

  const clickClusters = useMemo(() => {
    if (!heatmap?.points.length) return [];

    return [...heatmap.points]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [heatmap]);

  const selectedPage = pages.find(
    (page) => page.pageUrl === selectedPageUrl
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <div className="eyebrow">BEHAVIOURAL ANALYSIS</div>
          <h1>Click heatmaps</h1>
          <p>
            Analyze where visitors click on each tracked storefront page. Raw
            click events are normalized against the visitor viewport and grouped
            into visual click-density clusters.
          </p>
        </div>

        <button className="refresh-button" onClick={loadPages}>
          Refresh data
        </button>
      </section>

      {error && (
        <div className="error-card">
          <strong>Heatmap request failed</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">PAGE SELECTION</div>
            <h2>Choose a tracked storefront page</h2>
          </div>

          <span className="panel-note">
            {pages.length} tracked page{pages.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="toolbar">
          <select
            className="select"
            value={selectedPageUrl}
            onChange={(event) => setSelectedPageUrl(event.target.value)}
            disabled={loadingPages || pages.length === 0}
            style={{ width: "min(760px, 100%)" }}
          >
            {pages.length === 0 ? (
              <option value="">No tracked pages yet</option>
            ) : (
              pages.map((page) => (
                <option key={page.pageUrl} value={page.pageUrl}>
                  {shortUrl(page.pageUrl)}
                </option>
              ))
            )}
          </select>

          {selectedPage && (
            <span className="muted" style={{ fontSize: 12 }}>
              Last observed: {formatDate(selectedPage.lastSeen)}
            </span>
          )}
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Raw clicks</span>
          <strong>{heatmap?.totalClicks ?? "—"}</strong>
          <small>Only non-funnel click coordinates are included</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Clicking sessions</span>
          <strong>{heatmap?.uniqueSessions ?? "—"}</strong>
          <small>Distinct sessions with at least one raw click</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Density clusters</span>
          <strong>{heatmap?.points.length ?? "—"}</strong>
          <small>Grouped coordinate regions on this page</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Tracked page views</span>
          <strong>{selectedPage?.pageViews ?? "—"}</strong>
          <small>Context for interpreting click concentration</small>
        </article>
      </section>

      <section className="dashboard-grid heatmap-layout">
        <article className="panel heatmap-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">INTERACTION DENSITY</div>
              <h2>Normalized click distribution</h2>
            </div>

            <div className="heatmap-legend">
              <span>Lower density</span>
              <div className="heatmap-legend-scale">
                <i />
                <i />
                <i />
                <i />
              </div>
              <span>Higher density</span>
            </div>
          </div>

          {loadingHeatmap ? (
            <div className="empty">Loading heatmap coordinates…</div>
          ) : !selectedPageUrl ? (
            <div className="empty">
              No page is available. Open the demo storefront and generate page
              views and clicks first.
            </div>
          ) : !heatmap?.points.length ? (
            <div className="empty">
              This page has no raw click coordinates yet. Structured funnel
              events may exist, but visitors must click on the storefront to
              populate the heatmap.
            </div>
          ) : (
            <div className="heatmap-canvas-wrap">
              <div className="heatmap-browser">
                <div className="heatmap-browser-top">
                  <span className="browser-dot" />
                  <span className="browser-dot" />
                  <span className="browser-dot" />
                  <div className="browser-address">{shortUrl(selectedPageUrl)}</div>
                </div>

                <div className="heatmap-canvas">
                  <div className="storefront-mock">
                    <header className="mock-nav">
                      <strong>northstar</strong>
                      <nav>
                        <span>Shop</span>
                        <span>Collections</span>
                        <span>Journal</span>
                      </nav>
                      <button>Bag (0)</button>
                    </header>

                    <section className="mock-hero">
                      <div>
                        <small>SPRING / SUMMER</small>
                        <h3>
                          Objects for
                          <br />
                          everyday use.
                        </h3>
                        <button>Shop collection</button>
                      </div>
                    </section>

                    <section className="mock-products">
                      <article>
                        <div />
                        <span>Everyday object</span>
                        <small>₹1,200</small>
                      </article>
                      <article>
                        <div />
                        <span>Studio edition</span>
                        <small>₹1,800</small>
                      </article>
                      <article>
                        <div />
                        <span>Utility series</span>
                        <small>₹950</small>
                      </article>
                    </section>
                  </div>

                  {heatmap.points.map((point, index) => {
                    const viewportWidth = point.viewportWidth || 1440;
                    const viewportHeight = point.viewportHeight || 900;

                    const left = Math.min(
                      98,
                      Math.max(2, (point.x / viewportWidth) * 100)
                    );

                    const top = Math.min(
                      98,
                      Math.max(2, (point.y / viewportHeight) * 100)
                    );

                    const strength = heatStrength(point.count, maxCount);
                    const size = 24 + strength * 62;

                    return (
                      <span
                        key={`${point.x}-${point.y}-${index}`}
                        className="heat-point"
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          opacity: 0.22 + strength * 0.58,
                        }}
                        title={`${point.count} click${point.count === 1 ? "" : "s"} near ${Math.round(left)}%, ${Math.round(top)}%`}
                      >
                        <b>{point.count}</b>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="heatmap-footnote">
            <strong>Methodology:</strong> click coordinates are scaled by each
            visitor&apos;s viewport width and height before rendering. The
            storefront visual is a representative canvas, not a pixel-perfect
            replay of the original page.
          </div>
        </article>

        <aside className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TOP CLICK REGIONS</div>
              <h2>Highest-density clusters</h2>
            </div>
          </div>

          {!clickClusters.length ? (
            <div className="empty">
              Click clusters will appear after visitors interact with the page.
            </div>
          ) : (
            <div className="cluster-list">
              {clickClusters.map((point, index) => {
                const viewportWidth = point.viewportWidth || 1440;
                const viewportHeight = point.viewportHeight || 900;
                const xPercent = Math.round((point.x / viewportWidth) * 100);
                const yPercent = Math.round((point.y / viewportHeight) * 100);

                return (
                  <article className="cluster-row" key={`${point.x}-${point.y}-${index}`}>
                    <div className="cluster-rank">{index + 1}</div>

                    <div className="cluster-info">
                      <strong>
                        {point.count} click{point.count === 1 ? "" : "s"}
                      </strong>
                      <span>
                        Approx. {xPercent}% horizontal · {yPercent}% vertical
                      </span>
                    </div>

                    <div
                      className="cluster-bar"
                      style={{
                        width: `${Math.max(
                          18,
                          (point.count / maxCount) * 100
                        )}%`,
                      }}
                    />
                  </article>
                );
              })}
            </div>
          )}

          <div className="coverage-list" style={{ marginTop: 22 }}>
            <div>
              <strong>Included</strong>
              <span>Raw click coordinates from the tracker</span>
            </div>

            <div>
              <strong>Excluded</strong>
              <span>Structured funnel events such as add_to_bag</span>
            </div>

            <div>
              <strong>Current scope</strong>
              <span>Desktop and mobile clicks normalized per viewport</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}