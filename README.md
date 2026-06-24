# CausalFunnel Analytics Dashboard

A full-stack analytics dashboard for visualizing user-session behavior, conversion funnels, retention patterns, and engagement metrics.

The project provides an event-tracking backend, a dashboard frontend, and a lightweight tracker script that can be embedded in a client application to capture user interactions.

## Features

* Session-based event tracking
* Funnel analysis for conversion steps
* User session exploration
* Heatmap-style interaction analytics
* Dashboard views for analytics and sessions
* REST API for ingesting and querying events
* Embeddable browser tracker script
* Seed/demo data for local testing

## Project Structure

```text
FullStackAssignmentCausalFunnel/
├── backend/                 # Node.js/TypeScript API and database models
│   ├── src/
│   │   ├── models/          # Event and session schemas
│   │   ├── routes/          # Analytics API routes
│   │   ├── db.ts            # Database connection
│   │   └── server.ts        # Backend entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                # Next.js analytics dashboard
│   ├── app/
│   │   ├── heatmap/         # Heatmap analytics page
│   │   ├── sessions/        # Session analytics page
│   │   └── page.tsx         # Main dashboard
│   ├── lib/api.ts           # API client
│   └── package.json
│
├── tracker/                 # Client-side event tracking script
│   └── tracker.js
│
├── demo/                    # Demo application/static files
│   └── index.html
│
└── README.md
```

## Technology Stack

| Layer     | Technologies                 |
| --------- | ---------------------------- |
| Frontend  | Next.js, React, TypeScript   |
| Backend   | Node.js, Express, TypeScript |
| Database  | MongoDB with Mongoose        |
| Tracking  | JavaScript browser tracker   |
| API Style | REST                         |

## Prerequisites

Install the following before running the project:

* Node.js 18 or later
* npm
* MongoDB instance, either local or MongoDB Atlas

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sirohiaryan/FullStackAssignmentCausalfunnel.git
cd FullStackAssignmentCausalFunnel
```

### 2. Configure the backend

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/causalfunnel
```

Start the backend:

```bash
npm run dev
```

The API should run on:

```text
http://localhost:5000
```

### 3. Configure and run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard should run on:

```text
http://localhost:3000
```

Open `http://localhost:3000` in a browser.

## Event Tracking

The tracker captures browser interactions and sends them to the backend.

Typical event types include:

* Page views
* Clicks
* Form submissions
* Scroll depth
* Session start and session activity
* Funnel-step interactions

Add the tracker script to a client application or use the provided `demo/index.html` file for testing.

## API Overview

The backend exposes endpoints for analytics ingestion and retrieval.

Typical API responsibilities include:

* Receiving tracked events
* Storing session and event data
* Returning funnel metrics
* Returning session-level data
* Returning heatmap interaction data

Refer to the backend route definitions in:

```text
backend/src/routes/analytics.ts
```

for the exact endpoint paths and request formats.

## Running the Demo

After starting the backend and frontend:

1. Open the demo application.
2. Perform interactions such as clicks, navigation, or form actions.
3. Open the dashboard.
4. Review captured sessions, funnel progression, and heatmap data.

## Environment Variables

### Backend

| Variable      | Description                     |
| ------------- | ------------------------------- |
| `PORT`        | Port used by the backend server |
| `MONGODB_URI` | MongoDB connection string       |

Do not commit `.env` files containing credentials.

## Development Notes

Generated folders are intentionally excluded from Git:

```text
node_modules/
.next/
dist/
.env
```

Install dependencies after cloning:

```bash
npm install
```

## Future Improvements

* Authentication and multi-tenant workspaces
* Funnel creation through the dashboard UI
* Date-range filtering and cohort analysis
* Exportable reports
* Real-time event streaming
* Rate limiting and event validation
* Docker deployment configuration
* Automated tests and CI/CD pipeline

## Author

Aryan Sirohi
