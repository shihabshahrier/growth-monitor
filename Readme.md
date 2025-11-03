# 🧩 GrowthMonitor Backend — Technical Documentation

## Overview

The backend consists of two main services inside a monorepo:

```
/server
 ├── /api          → Node.js Express API Server (Core CRUD, Auth, SSE)
 └── /ai_worker    → Python FastAPI Service (LangGraph + Gemini 2.5 Pro)
```

Both share:

* **PostgreSQL (NeonDB)** — Main relational database.
* **Redis (Upstash)** — Job queue, token blacklist, caching, and streaming buffers.
* **Google Cloud Storage (GCS)** — File uploads (CSV, images, reports).

---

## 1. Architecture Summary

```
Frontend (React) 
   ↓
API Server (Express + Prisma)
   ↙︎                 ↘︎
Postgres (NeonDB)     Redis (Upstash)
                        ↓
                 AI Worker (FastAPI + LangGraph + Gemini)
                        ↓
                  Redis (stream buffer)
                        ↓
                 Express SSE Endpoint → Frontend
```

* **Express API** handles authentication, file uploads, CRUD, and Redis job queuing.
* **FastAPI Worker** consumes queued jobs, processes AI queries, and pushes streamed results back to Redis.
* **Frontend** (later) listens to SSE streams for live AI replies.

---

## 2. Folder Structure

```
/server
│
├── /api
│   ├── /src
│   │   ├── /controllers
│   │   ├── /routes
│   │   ├── /middlewares
│   │   ├── /services
│   │   ├── /utils
│   │   └── app.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── package.json
│   └── Dockerfile
│
└── /ai_worker
    ├── main.py
    ├── queue_consumer.py
    ├── ai_pipeline.py
    ├── db.py
    ├── redis_client.py
    ├── requirements.txt
    └── Dockerfile
```

---

## 3. Environment Variables (`.env`)

```bash
# Common
NODE_ENV=development
PORT=8080

# PostgreSQL (NeonDB)
DATABASE_URL="postgresql://user:password@ep-neon-host.neon.tech/growthmonitor?sslmode=require"

# Redis (Upstash)
REDIS_URL="rediss://<user>:<password>@global.upstash.io"

# JWT
ACCESS_TOKEN_SECRET="supersecretaccesskey"
REFRESH_TOKEN_SECRET="supersecretrefreshkey"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# GCP
GCP_PROJECT_ID=growthmonitor
GCP_BUCKET_NAME=growthmonitor-bucket
GCP_CLIENT_EMAIL=service-account@growthmonitor.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...END PRIVATE KEY-----\n"

# AI Worker
AI_API_URL="http://ai_worker:8000"
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 4. Dependencies

### Express API

* `express`
* `cors`
* `jsonwebtoken`
* `bcryptjs`
* `morgan`
* `dotenv`
* `prisma`
* `@prisma/client`
* `ioredis`
* `multer`
* `@google-cloud/storage`

### AI Worker

* `fastapi`
* `uvicorn`
* `redis`
* `langchain`
* `langgraph`
* `pandas`
* `sqlalchemy`
* `google-generativeai`

---

## 5. Prisma Schema (NeonDB)

```prisma
// /server/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(uuid())
  name           String
  email          String   @unique
  passwordHash   String
  role           String   @default("OWNER")
  refreshTokens  RefreshToken[]
  createdAt      DateTime @default(now())
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
}

model Sale {
  id           String   @id @default(uuid())
  userId       String
  date         DateTime
  product      String
  amount       Float
  channel      String
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model Campaign {
  id           String   @id @default(uuid())
  userId       String
  name         String
  platform     String
  startDate    DateTime
  endDate      DateTime
  responses    Int
  spend        Float
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model Insight {
  id        String   @id @default(uuid())
  userId    String
  title     String
  summary   String
  data      Json
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## 6. Authentication Flow (JWT with Refresh)

### Token System

* **Access Token (short-lived, 15m)** — for all API requests.
* **Refresh Token (long-lived, 7d)** — stored HTTP-only cookie.
* **Blacklist Mechanism:**
  Revoked refresh tokens stored in Redis set: `revoked_tokens`.

### Flow Summary

1. User logs in → receives both tokens.
2. Access token used in headers (`Authorization: Bearer <token>`).
3. When expired → client silently calls `/auth/refresh`.
4. Logout → refresh token added to Redis blacklist.

---

## 7. Express Server Structure

### Key Folders

| Folder         | Purpose                                     |
| -------------- | ------------------------------------------- |
| `/controllers` | Route handlers (auth, sales, campaigns, AI) |
| `/routes`      | Route definitions                           |
| `/middlewares` | Auth guards, error handlers                 |
| `/services`    | Redis, Prisma, GCP wrappers                 |
| `/utils`       | Token helpers, CSV parsers                  |

---

## 8. Redis Integration (Upstash)

**Use cases:**

* Queue jobs: `ai_jobs`
* Stream tokens: `ai_stream:<jobId>`
* Store AI results: `ai_result:<jobId>`
* Blacklist refresh tokens: `revoked_tokens`

**Service Example:**

```js
// /services/redis.service.js
import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL);
```

---

## 9. GCP Bucket Upload

**Setup:**

```js
// /services/gcp.service.js
import { Storage } from "@google-cloud/storage";
const storage = new Storage({
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GCP_PROJECT_ID,
});

export const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
```

**Controller Example:**

```js
export const uploadFile = async (req, res) => {
  const blob = bucket.file(`uploads/${Date.now()}_${req.file.originalname}`);
  const blobStream = blob.createWriteStream();
  blobStream.on("finish", () => res.json({ url: blob.publicUrl() }));
  blobStream.end(req.file.buffer);
};
```

---

## 10. AI Query + SSE Response Flow

**Enqueue job:**

```js
// POST /ai/query
const jobId = uuidv4();
await redis.lpush("ai_jobs", JSON.stringify({ jobId, userId, query }));
res.status(202).json({ jobId });
```

**Stream result to frontend:**

```js
// GET /ai/stream/:jobId
app.get("/ai/stream/:jobId", (req, res) => {
  const { jobId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  const interval = setInterval(async () => {
    const chunk = await redis.lpop(`ai_stream:${jobId}`);
    if (chunk) {
      res.write(`data: ${chunk}\n\n`);
      if (chunk.includes('"done":true')) {
        clearInterval(interval);
        res.end();
      }
    }
  }, 1000);
});
```

---

## 11. AI Worker (FastAPI + LangGraph)

**Consumes queue → processes → streams results**

```python
# queue_consumer.py
while True:
    job = redis.brpop("ai_jobs", 0)
    job_data = json.loads(job[1])
    job_id = job_data["jobId"]

    for token in process_query(job_data["query"]):
        redis.rpush(f"ai_stream:{job_id}", json.dumps({"content": token}))
    redis.rpush(f"ai_stream:{job_id}", json.dumps({"done": True}))
```

---

## 12. Deployment Notes

| Service               | Platform           | Notes                         |
| --------------------- | ------------------ | ----------------------------- |
| **API Server**        | Render / Cloud Run | Expose HTTPS                  |
| **AI Worker**         | Cloud Run / VM     | Connects to same Redis        |
| **Redis (Upstash)**   | Serverless         | Managed queue                 |
| **Postgres (NeonDB)** | Cloud Postgres     | SSL required                  |
| **GCP Storage**       | Cloud Storage      | Public read on uploaded files |

---

## 13. Security Checklist

* [x] JWT stored as HTTP-only cookie.
* [x] Access token expiry < 20m.
* [x] Refresh token blacklist on logout.
* [x] GCP private key escaped in `.env`.
* [x] Redis rate limiting (5 requests/sec per IP).
* [x] Enforce HTTPS, CORS per domain.
* [x] Disable public file listing in GCP bucket.

---

## 14. Future Upgrades

* Replace SSE with true streaming from FastAPI via HTTP chunking.
* Add WebSocket for multi-user session chat.
* Include Prisma migrations CI/CD workflow.
* Role-based permissions (admin, staff).
* Worker retry queue with exponential backoff.