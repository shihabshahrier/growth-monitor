# GrowthMonitor Backend Monorepo

This directory hosts the Express API (`server/api`) and the AI worker (`server/ai_worker`). Follow the steps below to run services locally.

## Prerequisites

- Node.js 20+
- npm 9+
- Python 3.11+
- PostgreSQL instance (e.g. Neon)
- Redis instance (e.g. Upstash)
- Google Cloud Storage bucket + service account (optional in local dev)
- Gemini API key (optional – worker runs in mock mode without it)

## Environment

Create a `.env` file at the repo root and export it into both services when running locally. Required keys mirror the values documented in the main `Readme.md`.

```bash
# Common
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
GCP_PROJECT_ID=...
GCP_BUCKET_NAME=...
GCP_CLIENT_EMAIL=...
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
AI_API_URL=http://localhost:8000
GEMINI_API_KEY=sk-...
```

> The AI worker automatically falls back to a deterministic mock response if `GEMINI_API_KEY` is missing, which is useful for local development.

## API Server

```bash
cd server/api
npm install
npx prisma generate
npm run dev
```

Key endpoints are namespaced under `/api` (for example, `POST /api/auth/login`, `POST /api/ai/query`, `GET /api/ai/stream/:jobId`).

## AI Worker

```bash
cd server/ai_worker
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn ai_worker.main:app --host 0.0.0.0 --port 8000
```

The worker launches a background queue consumer on startup. Jobs pushed into the `ai_jobs` Redis list are streamed to `ai_stream:<jobId>` and persisted to `ai_result:<jobId>`.

## Seeding Data

After configuring the database, run:

```bash
cd server/api
npx prisma migrate deploy
npm run prisma:seed
```

This creates a demo owner account (`demo@growthmonitor.ai` / `password123`) with sample sales, campaigns, and insights.

## Docker

Build images for both services:

```bash
# API
cd server/api
docker build -t growthmonitor-api .

# Worker
cd ../ai_worker
docker build -t growthmonitor-ai-worker .
```

Each image expects the environment variables listed above at runtime.

## Workflow Smoke Test

After both services are running locally with real credentials, you can mimic a full founder session via:

```bash
cd server/api
API_BASE_URL=http://localhost:8080/api npm run test:workflow
```

The script registers/logs in a throwaway user, exercises core CRUD flows, refreshes JWTs, enqueues an AI job, waits for the worker response, and finally verifies logout + refresh revocation. Configure `TEST_EMAIL`, `TEST_PASSWORD`, and `TEST_NAME` to reuse an existing account if needed.
