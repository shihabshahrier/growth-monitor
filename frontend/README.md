# GrowthMonitor Frontend

GrowthMonitor’s web client is a React + Vite single-page app that blends an AI chat copilot with revenue analytics for Bangladeshi SMEs. It consumes the REST and SSE endpoints exposed by the Express API and AI worker.

## Tech Stack

- React 19 + Vite 7
- TailwindCSS with custom rose-gold theme
- Framer Motion for micro-animations
- Recharts for analytics visualisations
- Sonner toast notifications
- Custom hooks for JWT auth + SSE streaming

## Getting Started

```bash
cd frontend
cp .env.example .env            # adjust VITE_API_URL if needed
npm install
npm run dev
```

Set `VITE_API_URL` to the base URL of the API service (defaults to `http://localhost:8080/api`). The app assumes the API issues refresh tokens via HTTP-only cookies and access tokens in the JSON payload, matching the backend implementation in this repo.

### Production Build

```bash
npm run build
npm run preview
```

## App Structure

```
/src
 ├── components/
 │   ├── analytics/            # metric cards + charts
 │   ├── chat/                 # AI chat UI + streaming renderer
 │   ├── layout/               # Navbar, Sidebar, Upload modal
 │   ├── ui/                   # Tailwind-based primitives (button, input, modal)
 │   └── common/               # shared loading screen
 ├── contexts/                 # auth, theme, locale providers
 ├── hooks/                    # AI SSE streaming hook
 ├── pages/                    # Auth and Dashboard views
 ├── utils/                    # i18n dictionaries and helpers
 └── lib/                      # tailwind-merge utilities
```

## Key Features

- **Auth flow** — login/signup with refresh token rotation, automatically retries 401s.
- **AI chat** — streams responses via SSE, with auto-scroll, typing dots, and status messaging.
- **Uploads** — CSV preview modal for sales/campaign imports.
- **Analytics** — cards + charts for sales trend, campaign ROI, and channel mix.
- **Localization** — instant EN ↔︎ BN toggle, persistent per user.
- **Theming** — light/dark toggle with rose-gold brand palette.

## Testing Notes

The SPA expects the backend and worker from `/server` to be running with valid credentials for Postgres, Redis, GCS, and Gemini. Use the `npm run test:workflow` script in `/server/api` to simulate the end-to-end path after bootstrapping both services.
