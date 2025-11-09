# 🚀 GrowthMonitor# 🚀 GrowthMonitor



> AI-powered business intelligence platform for SMEs to analyze sales, campaigns, and customer data.> AI-powered business intelligence platform for SMEs to analyze sales, campaigns, and customer data.



## 📋 Overview## 📋 Overview



GrowthMonitor is a comprehensive CRM and analytics platform that helps small and medium enterprises track sales performance, manage marketing campaigns, and gain AI-powered insights through natural language queries.GrowthMonitor is a comprehensive CRM and analytics platform that helps small and medium enterprises track sales performance, manage marketing campaigns, and gain AI-powered insights.



### Key Features### Key Features



- 📊 **Sales Analytics** - Track revenue, orders, and performance metrics in real-time- 📊 **Sales Analytics** - Track revenue, orders, and performance metrics

- 🎯 **Campaign Management** - Monitor marketing campaigns across multiple channels- 🎯 **Campaign Management** - Monitor marketing campaigns across channels

- 👥 **Customer Intelligence** - Analyze customer behavior, segments, and retention- 👥 **Customer Intelligence** - Analyze customer behavior and segments

- 🤖 **AI Assistant** - Natural language queries powered by Google Gemini- 🤖 **AI Assistant** - Natural language queries powered by Google Gemini

- 📈 **Automated Insights** - AI-generated recommendations and trend analysis- 📈 **Real-time Insights** - Automated recommendations and trend analysis

- 🔐 **Multi-tenant** - Role-based access control with team collaboration- 🔐 **Role-Based Access** - Multi-tenant with team collaboration

- 📤 **CSV Import/Export** - Bulk data import and templated exports

- 💬 **Conversation History** - Save and resume AI chat sessions## 🏗️ Architecture



## 🏗️ Architecture```

Frontend (React + Vite)

```        ↓

┌─────────────────┐API Server (Node.js + Express + Prisma)

│  React Frontend │   ↙                              ↘

│ (Vite+Tailwind) │PostgreSQL (NeonDB)          Redis (Upstash)

└────────┬────────┘                                    ↓

         │ REST API                          AI Worker (Python + LangGraph)

         ↓                                    ↓

┌─────────────────┐                          Google Gemini 2.5 Flash

│  Express Server │```

│  (JWT + Prisma) │

└─────┬──────┬────┘### Services

      │      │

      ↓      ↓- **Frontend** - React SPA with TailwindCSS

┌──────┐  ┌──────────┐- **API Server** - Express REST API with JWT auth

│ Neon │  │  Upstash │- **AI Worker** - Python FastAPI service for AI queries

│  DB  │  │  Redis   │- **Database** - PostgreSQL (Neon serverless)

└──────┘  └────┬─────┘- **Cache/Queue** - Redis (Upstash)

               │ Queue- **Storage** - Google Cloud Storage

               ↓

      ┌────────────────┐---

      │  AI Worker     │

      │ (FastAPI +     │## 1. Architecture Summary

      │  LangGraph +   │

      │  Gemini)       │```

      └────────────────┘Frontend (React) 

```   ↓

API Server (Express + Prisma)

### Technology Stack   ↙︎                 ↘︎

Postgres (NeonDB)     Redis (Upstash)

**Frontend:**                        ↓

- React 18 + Vite                 AI Worker (FastAPI + LangGraph + Gemini)

- TailwindCSS + shadcn/ui                        ↓

- React Router v6                  Redis (stream buffer)

- Recharts for visualizations                        ↓

                 Express SSE Endpoint → Frontend

**Backend API:**```

- Node.js + Express

- Prisma ORM* **Express API** handles authentication, file uploads, CRUD, and Redis job queuing.

- JWT authentication* **FastAPI Worker** consumes queued jobs, processes AI queries, and pushes streamed results back to Redis.

- Redis (Upstash)* **Frontend** (later) listens to SSE streams for live AI replies.



**AI Worker:**---

- Python + FastAPI

- LangChain + LangGraph## 2. Folder Structure

- Google Gemini 2.5 Flash

- SQLAlchemy```

/server

**Infrastructure:**│

- PostgreSQL (Neon serverless)├── /api

- Redis (Upstash)│   ├── /src

- Google Cloud Storage│   │   ├── /controllers

│   │   ├── /routes

## 🚀 Quick Start│   │   ├── /middlewares

│   │   ├── /services

### Prerequisites│   │   ├── /utils

│   │   └── app.js

- Node.js 18+│   │

- Python 3.9+│   ├── prisma/

- PostgreSQL (or Neon account)│   │   ├── schema.prisma

- Redis (or Upstash account)│   │   └── seed.js

- Google Gemini API key│   │

│   ├── package.json

### 1. Clone the repository│   └── Dockerfile

│

```bash└── /ai_worker

git clone https://github.com/yourusername/growth-monitor.git    ├── main.py

cd growth-monitor    ├── queue_consumer.py

```    ├── ai_pipeline.py

    ├── db.py

### 2. Setup Backend API    ├── redis_client.py

    ├── requirements.txt

```bash    └── Dockerfile

cd server/api```



# Install dependencies---

npm install

## 3. Environment Variables (`.env`)

# Create .env file (copy from .env.example)

# Add your database URL, Redis URL, JWT secrets, etc.```bash

# Common

# Generate Prisma clientNODE_ENV=development

npx prisma generatePORT=8080



# Run migrations# PostgreSQL (NeonDB)

npx prisma migrate deployDATABASE_URL="postgresql://user:password@ep-neon-host.neon.tech/growthmonitor?sslmode=require"



# Seed demo data (optional)# Redis (Upstash)

npm run prisma:seedREDIS_URL="rediss://<user>:<password>@global.upstash.io"



# Start server# JWT

npm run devACCESS_TOKEN_SECRET="supersecretaccesskey"

```REFRESH_TOKEN_SECRET="supersecretrefreshkey"

ACCESS_TOKEN_EXPIRY="15m"

The API server will run on `http://localhost:8080`REFRESH_TOKEN_EXPIRY="7d"



### 3. Setup AI Worker# GCP

GCP_PROJECT_ID=growthmonitor

```bashGCP_BUCKET_NAME=growthmonitor-bucket

cd server/ai_workerGCP_CLIENT_EMAIL=service-account@growthmonitor.iam.gserviceaccount.com

GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...END PRIVATE KEY-----\n"

# Create virtual environment

python -m venv .venv# AI Worker

source .venv/bin/activate  # On Windows: .venv\Scripts\activateAI_API_URL="http://ai_worker:8000"

GEMINI_API_KEY="your-gemini-api-key"

# Install dependencies```

pip install -r requirements.txt

---

# Create .env file with DATABASE_URL, REDIS_URL, GEMINI_API_KEY

## 4. Dependencies

# Start worker

python main.py### Express API

```

* `express`

The AI worker will run on `http://localhost:8000`* `cors`

* `jsonwebtoken`

### 4. Setup Frontend* `bcryptjs`

* `morgan`

```bash* `dotenv`

cd frontend* `prisma`

* `@prisma/client`

# Install dependencies* `ioredis`

npm install* `multer`

* `@google-cloud/storage`

# Create .env file

# VITE_API_URL=http://localhost:8080/api### AI Worker



# Start development server* `fastapi`

npm run dev* `uvicorn`

```* `redis`

* `langchain`

The frontend will run on `http://localhost:5173`* `langgraph`

* `pandas`

### 5. Access the application* `sqlalchemy`

* `google-generativeai`

**Demo credentials:**

- Email: `demo@growthmonitor.ai`---

- Password: `password123`

## 5. Prisma Schema (NeonDB)

## 📝 Environment Variables

```prisma

### Backend API (.env)// /server/api/prisma/schema.prisma

generator client {

```env  provider = "prisma-client-js"

NODE_ENV=production}

PORT=8080

datasource db {

DATABASE_URL=postgresql://user:password@host/database  provider = "postgresql"

REDIS_URL=rediss://default:password@host:6379  url      = env("DATABASE_URL")

}

ACCESS_TOKEN_SECRET=your-secret-key-min-32-chars

REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-charsmodel User {

ACCESS_TOKEN_EXPIRY=15m  id             String   @id @default(uuid())

REFRESH_TOKEN_EXPIRY=7d  name           String

  email          String   @unique

GCP_PROJECT_ID=your-project-id  passwordHash   String

GCP_BUCKET_NAME=your-bucket-name  role           String   @default("OWNER")

GCP_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com  refreshTokens  RefreshToken[]

GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  createdAt      DateTime @default(now())

}

AI_API_URL=http://localhost:8000

```model RefreshToken {

  id        String   @id @default(uuid())

### AI Worker (.env)  userId    String

  token     String   @unique

```env  expiresAt DateTime

DATABASE_URL=postgresql://user:password@host/database  revoked   Boolean  @default(false)

REDIS_URL=rediss://default:password@host:6379  user      User     @relation(fields: [userId], references: [id])

}

GEMINI_API_KEY=your-gemini-api-key

GEMINI_MODEL=gemini-2.0-flash-expmodel Sale {

GEMINI_TEMPERATURE=0.2  id           String   @id @default(uuid())

GEMINI_MAX_OUTPUT_TOKENS=2048  userId       String

```  date         DateTime

  product      String

### Frontend (.env)  amount       Float

  channel      String

```env  createdAt    DateTime @default(now())

VITE_API_URL=http://localhost:8080/api  user         User     @relation(fields: [userId], references: [id])

```}



## 📦 Project Structuremodel Campaign {

  id           String   @id @default(uuid())

```  userId       String

growth-monitor/  name         String

├── frontend/                 # React frontend  platform     String

│   ├── src/  startDate    DateTime

│   │   ├── components/      # UI components  endDate      DateTime

│   │   ├── pages/           # Page components  responses    Int

│   │   ├── contexts/        # React contexts  spend        Float

│   │   ├── hooks/           # Custom hooks  createdAt    DateTime @default(now())

│   │   └── utils/           # Utility functions  user         User     @relation(fields: [userId], references: [id])

│   └── package.json}

│

├── server/model Insight {

│   ├── api/                 # Express API server  id        String   @id @default(uuid())

│   │   ├── prisma/          # Database schema & migrations  userId    String

│   │   ├── src/  title     String

│   │   │   ├── controllers/ # Route handlers  summary   String

│   │   │   ├── routes/      # API routes  data      Json

│   │   │   ├── middlewares/ # Auth, RBAC, etc.  createdAt DateTime @default(now())

│   │   │   ├── services/    # Business logic  user      User     @relation(fields: [userId], references: [id])

│   │   │   └── utils/       # Helper functions}

│   │   └── package.json```

│   │

│   └── ai_worker/           # Python AI service---

│       ├── ai_pipeline.py   # LangGraph agent

│       ├── db.py            # Database queries## 6. Authentication Flow (JWT with Refresh)

│       ├── queue_consumer.py # Redis job consumer

│       └── requirements.txt### Token System

│

└── templates/               # CSV templates* **Access Token (short-lived, 15m)** — for all API requests.

```* **Refresh Token (long-lived, 7d)** — stored HTTP-only cookie.

* **Blacklist Mechanism:**

## 🔐 Authentication  Revoked refresh tokens stored in Redis set: `revoked_tokens`.



JWT-based authentication with refresh tokens:### Flow Summary



1. **Login** - Receive access token (15m) + refresh token (7d)1. User logs in → receives both tokens.

2. **Authorization** - `Authorization: Bearer <access_token>`2. Access token used in headers (`Authorization: Bearer <token>`).

3. **Auto-refresh** - Silent token refresh on expiry3. When expired → client silently calls `/auth/refresh`.

4. **Logout** - Refresh token blacklisted in Redis4. Logout → refresh token added to Redis blacklist.



## 🤖 AI Features---



### Natural Language Queries## 7. Express Server Structure



```### Key Folders

"Show me top 5 selling products"

"What were sales this month?"| Folder         | Purpose                                     |

"Which campaign performed best?"| -------------- | ------------------------------------------- |

"Show me customer retention rate"| `/controllers` | Route handlers (auth, sales, campaigns, AI) |

```| `/routes`      | Route definitions                           |

| `/middlewares` | Auth guards, error handlers                 |

### AI Tools| `/services`    | Redis, Prisma, GCP wrappers                 |

| `/utils`       | Token helpers, CSV parsers                  |

- Sales analysis (channel, region, time, product)

- Campaign performance tracking---

- Customer segmentation & retention

- Time-series forecasting## 8. Redis Integration (Upstash)

- Automated insights

**Use cases:**

## 📊 API Documentation

* Queue jobs: `ai_jobs`

### Authentication* Stream tokens: `ai_stream:<jobId>`

- `POST /api/auth/register` - Register* Store AI results: `ai_result:<jobId>`

- `POST /api/auth/login` - Login* Blacklist refresh tokens: `revoked_tokens`

- `POST /api/auth/refresh` - Refresh token

- `POST /api/auth/logout` - Logout**Service Example:**



### Sales```js

- `GET /api/sales` - List sales// /services/redis.service.js

- `POST /api/sales` - Create saleimport Redis from "ioredis";

- `PUT /api/sales/:id` - Update saleexport const redis = new Redis(process.env.REDIS_URL);

- `DELETE /api/sales/:id` - Delete sale```



### Campaigns---

- `GET /api/campaigns` - List campaigns

- `POST /api/campaigns` - Create campaign## 9. GCP Bucket Upload

- `PUT /api/campaigns/:id` - Update campaign

- `DELETE /api/campaigns/:id` - Delete campaign**Setup:**



### AI Chat```js

- `POST /api/ai/query` - Submit query (returns jobId)// /services/gcp.service.js

- `GET /api/ai/stream/:jobId` - Stream response (SSE)import { Storage } from "@google-cloud/storage";

const storage = new Storage({

### Conversations  credentials: {

- `GET /api/conversations` - List conversations    client_email: process.env.GCP_CLIENT_EMAIL,

- `POST /api/conversations` - Create conversation    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),

- `GET /api/conversations/:id` - Get conversation  },

- `DELETE /api/conversations/:id` - Delete conversation  projectId: process.env.GCP_PROJECT_ID,

});

## 🚢 Production Deployment

export const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

### Checklist```



- [ ] Set `NODE_ENV=production`**Controller Example:**

- [ ] Use strong JWT secrets (32+ characters)

- [ ] Enable HTTPS/SSL```js

- [ ] Configure CORS for your domainexport const uploadFile = async (req, res) => {

- [ ] Set up database backups  const blob = bucket.file(`uploads/${Date.now()}_${req.file.originalname}`);

- [ ] Enable Redis persistence  const blobStream = blob.createWriteStream();

- [ ] Configure rate limiting  blobStream.on("finish", () => res.json({ url: blob.publicUrl() }));

- [ ] Set up error monitoring (Sentry)  blobStream.end(req.file.buffer);

- [ ] Configure CDN for static assets};

- [ ] Set up CI/CD pipeline```



### Recommended Platforms---



| Service | Platform Options |## 10. AI Query + SSE Response Flow

|---------|-----------------|

| Frontend | Vercel, Netlify, Cloudflare Pages |**Enqueue job:**

| Backend API | Render, Railway, Google Cloud Run |

| AI Worker | Google Cloud Run, AWS ECS |```js

| Database | Neon, Supabase, Railway |// POST /ai/query

| Redis | Upstash, Redis Cloud |const jobId = uuidv4();

| Storage | Google Cloud Storage, AWS S3 |await redis.lpush("ai_jobs", JSON.stringify({ jobId, userId, query }));

res.status(202).json({ jobId });

## 📄 License```



MIT License**Stream result to frontend:**



## 🤝 Contributing```js

// GET /ai/stream/:jobId

Contributions welcome! Please open an issue or PR.app.get("/ai/stream/:jobId", (req, res) => {

  const { jobId } = req.params;

---  res.setHeader("Content-Type", "text/event-stream");

  const interval = setInterval(async () => {

Made with ❤️ for SMEs worldwide    const chunk = await redis.lpop(`ai_stream:${jobId}`);

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