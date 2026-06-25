"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiGet,
  EventRow,
  formatDateTime,
  formatNumber,
  FunnelResponse,
  FunnelStep,
  Overview,
  PageRow,
  readableEventName,
} from "../lib/api";

const FUNNEL_LABELS: Record<string, string> = {
  storefront_viewed: "Storefront viewed",
  category_filtered: "Category filtered",
  product_viewed: "Product viewed",
  wishlist_updated: "Wishlist updated",
  add_to_bag: "Added to bag",
  bag_viewed: "Bag viewed",
  payment_selected: "Payment selected",
  delivery_selected: "Delivery selected",
  order_confirmed: "Order confirmed",
};

function percentage(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function eventDescription(event: EventRow): string {
  const properties = event.properties || {};
  const productName =
    typeof properties.productName === "string"
      ? properties.productName
      : "";
  const paymentMethod =
    typeof properties.paymentMethod === "string"
      ? properties.paymentMethod.toUpperCase()
      : "";
  const deliveryDays =
    typeof properties.deliveryDays === "number"
      ? `${properties.deliveryDays}-day delivery`
      : "";

  if (productName) return productName;
  if (paymentMethod) return paymentMethod;
  if (deliveryDays) return deliveryDays;

  return event.pageTitle || event.path || event.pageUrl;
}

export default function DashboardHome() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [overviewData, funnelData, pagesData, eventsData] =
        await Promise.all([
          apiGet<Overview>("/api/overview"),
          apiGet<FunnelResponse>("/api/funnel"),
          apiGet<{ pages: PageRow[] }>("/api/pages"),
          apiGet<{ events: EventRow[] }>("/api/events", { limit: 8 }),
        ]);

      setOverview(overviewData);
      setFunnel(funnelData.funnel);
      setPages(pagesData.pages);
      setRecentEvents(eventsData.events);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load analytics data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const firstFunnelStep = funnel[0]?.sessionCount || 0;
  const lastFunnelStep = funnel[funnel.length - 1]?.sessionCount || 0;

  const conversionRate = useMemo(() => {
    if (!firstFunnelStep) return 0;
    return (lastFunnelStep / firstFunnelStep) * 100;
  }, [firstFunnelStep, lastFunnelStep]);

  const topPages = pages.slice(0, 5);
  const maxPageViews = Math.max(
    1,
    ...topPages.map((page) => page.pageViews || 0)
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <div className="eyebrow">CAUSALFUNNEL · ANALYTICS OVERVIEW</div>
          <h1>Storefront conversion intelligence</h1>
          <p>
            Session-based funnel performance, visitor behavior, page engagement,
            and recent purchase-intent activity.
          </p>
        </div>

        <button className="refresh-button" onClick={loadDashboard}>
          Refresh data
        </button>
      </section>

      {error ? (
        <section className="error-card">
          <strong>Dashboard unavailable</strong>
          <span>{error}</span>
          <span>
            Confirm that the backend is running at{" "}
            <code>http://localhost:4000</code>.
          </span>
        </section>
      ) : null}

      <section className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Anonymous sessions</span>
          <strong>{loading ? "—" : formatNumber(overview?.sessions)}</strong>
          <small>Unique browser sessions recorded</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Tracked events</span>
          <strong>
            {loading ? "—" : formatNumber(overview?.totalEvents)}
          </strong>
          <small>Views, clicks, and structured actions</small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Product-to-order conversion</span>
          <strong>{loading ? "—" : `${conversionRate.toFixed(1)}%`}</strong>
          <small>
            {formatNumber(lastFunnelStep)} completed orders from{" "}
            {formatNumber(firstFunnelStep)} entry sessions
          </small>
        </article>

        <article className="metric-card">
          <span className="metric-label">Tracked pages</span>
          <strong>{loading ? "—" : formatNumber(overview?.uniquePages)}</strong>
          <small>
            {formatNumber(overview?.pageViews)} total page views
          </small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel funnel-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CONVERSION FUNNEL</span>
              <h2>Visitor progression</h2>
            </div>
            <span className="panel-note">Distinct sessions per step</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading funnel data…</div>
          ) : funnel.length === 0 ? (
            <div className="empty-state">
              No funnel events exist yet. Open the demo store and interact with
              products, bag, payment, and delivery.
            </div>
          ) : (
            <div className="funnel-list">
              {funnel.map((step, index) => {
                const previous = funnel[index - 1];
                const width = firstFunnelStep
                  ? Math.max(
                      7,
                      (step.sessionCount / firstFunnelStep) * 100
                    )
                  : 7;

                const stepRate = previous?.sessionCount
                  ? (step.sessionCount / previous.sessionCount) * 100
                  : 100;

                return (
                  <div className="funnel-row" key={step.eventName}>
                    <div className="funnel-step-meta">
                      <span className="funnel-index">{index + 1}</span>
                      <div>
                        <strong>
                          {FUNNEL_LABELS[step.eventName] ||
                            readableEventName(step.eventName)}
                        </strong>
                        <small>
                          {formatNumber(step.eventCount)} total event
                          {step.eventCount === 1 ? "" : "s"}
                        </small>
                      </div>
                    </div>

                    <div className="funnel-bar-wrap">
                      <div
                        className="funnel-bar"
                        style={{ width: `${width}%` }}
                      />
                    </div>

                    <div className="funnel-values">
                      <strong>{formatNumber(step.sessionCount)}</strong>
                      <small>
                        {index === 0
                          ? "Baseline"
                          : `${stepRate.toFixed(1)}% from prior`}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="panel event-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LIVE ACTIVITY</span>
              <h2>Recent tracked events</h2>
            </div>
            <span className="panel-note">Latest 8 events</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading recent activity…</div>
          ) : recentEvents.length === 0 ? (
            <div className="empty-state">No events recorded yet.</div>
          ) : (
            <div className="event-list">
              {recentEvents.map((event, index) => (
                <div
                  className="event-row"
                  key={`${event._id || event.timestamp}-${index}`}
                >
                  <div className="event-marker" />
                  <div className="event-content">
                    <strong>
                      {readableEventName(event.eventName || event.eventType)}
                    </strong>
                    <span>{eventDescription(event)}</span>
                  </div>
                  <time>{formatDateTime(event.timestamp)}</time>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel pages-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PAGE PERFORMANCE</span>
              <h2>Most active storefront pages</h2>
            </div>
            <span className="panel-note">Ranked by page views</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading page performance…</div>
          ) : topPages.length === 0 ? (
            <div className="empty-state">No tracked pages yet.</div>
          ) : (
            <div className="page-performance-list">
              {topPages.map((page, index) => (
                <div className="page-performance-row" key={page.pageUrl}>
                  <div className="page-rank">{index + 1}</div>

                  <div className="page-name">
                    <strong>{page.pageUrl}</strong>
                    <div className="page-progress">
                      <span
                        style={{
                          width: `${Math.max(
                            5,
                            ((page.pageViews || 0) / maxPageViews) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="page-stat">
                    <strong>{formatNumber(page.pageViews)}</strong>
                    <small>views</small>
                  </div>

                  <div className="page-stat">
                    <strong>{formatNumber(page.clicks)}</strong>
                    <small>clicks</small>
                  </div>

                  <div className="page-stat">
                    <strong>{formatNumber(page.sessions)}</strong>
                    <small>sessions</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel measurement-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MEASUREMENT COVERAGE</span>
              <h2>What the tracker captures</h2>
            </div>
          </div>

          <div className="coverage-list">
            <div>
              <strong>Acquisition and session context</strong>
              <span>Session ID, referrer, entry page, browser context</span>
            </div>
            <div>
              <strong>Product discovery</strong>
              <span>Category filters, product views, wishlist actions</span>
            </div>
            <div>
              <strong>Cart behavior</strong>
              <span>Add-to-bag actions, quantity changes, bag value</span>
            </div>
            <div>
              <strong>Checkout intent</strong>
              <span>Payment method, COD rejection, delivery selection</span>
            </div>
            <div>
              <strong>Conversion and UX behavior</strong>
              <span>Order confirmation, inquiry events, click heatmaps</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}