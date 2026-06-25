# CausalFunnel Analytics

A full-stack product analytics platform that captures anonymous user behavior from a storefront demo and presents it through session analytics, funnel analysis, and click heatmaps.

The project consists of:

- A lightweight browser tracker
- An Express + MongoDB analytics backend
- A Next.js analytics dashboard
- A multi-page demo storefront used to generate real interaction data

---

## Features

### Event Tracking

The tracker records both structured funnel events and raw click events.

#### Automatically tracked

- Anonymous session ID
- Page views
- Page URL and path
- Referrer
- User agent
- Timestamp
- Raw click coordinates
- Browser viewport width and height
- Clicked element metadata:
  - tag name
  - element ID
  - class name
  - visible text

#### Structured funnel events

| User action | Event name | Important properties |
|---|---|---|
| Storefront opened | `storefront_viewed` | source, referrer |
| Category selected | `category_filtered` | category |
| Product opened | `product_viewed` | productId, productName, category, price |
| Wishlist updated | `wishlist_updated` | productId, action |
| Add to bag | `add_to_bag` | productId, productName, category, quantity, price |
| Bag opened | `bag_viewed` | itemsCount, cartValue |
| Quantity changed | `bag_quantity_changed` | productId, oldQuantity, newQuantity |
| Checkout started | `checkout_started` | itemsCount, cartValue |
| Payment selected | `payment_selected` | method |
| COD unavailable | `payment_unavailable` | method, reason |
| Delivery selected | `delivery_selected` | days, deliveryCharge |
| Product inquiry opened | `inquiry_opened` | productId |
| Product inquiry submitted | `inquiry_submitted` | productId, messageLength |
| Order confirmed | `order_confirmed` | paymentMethod, deliveryDays, deliveryCharge, orderValue, itemsCount |

---

## Analytics Dashboard

The dashboard provides three primary analytics views.

### Overview

- Funnel stage counts
- Unique sessions per stage
- Event counts per stage
- Funnel conversion analysis
- Drop-off analysis
- Product and checkout behavior metrics

### Sessions

- Recent anonymous visitor sessions
- Session-level event counts
- Page view and click counts
- Entry page and exit page
- Referrer and user-agent context
- Ordered event timeline for each visitor journey

### Heatmaps

- Raw click coordinate capture
- Click normalization across different viewport sizes
- Click-density clusters
- Click counts per cluster
- Unique sessions per tracked page
- Separate heatmaps for each demo storefront page

---

## Architecture

```text
CausalFunnel Analytics
│
├── demo/
│   ├── index.html
│   ├── product.html
│   ├── bag.html
│   ├── checkout.html
│   ├── confirmation.html
│   └── tracker.js
│
├── backend/
│   ├── src/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── server.ts
│   │   ├── models/
│   │   │   ├── Event.ts
│   │   │   └── Session.ts
│   │   └── routes/
│   │       └── analytics.ts
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── sessions/
    │   │   └── page.tsx
    │   └── heatmap/
    │       └── page.tsx
    ├── lib/
    │   └── api.ts
    ├── package.json
    └── .env.local
