# 🚀 GrowthMonitor

> AI-powered business intelligence platform for SMEs to analyze sales, campaigns, and customer data.

## 📋 Overview

GrowthMonitor is a comprehensive CRM and analytics platform that helps small and medium enterprises track sales performance, manage marketing campaigns, and gain AI-powered insights through natural language queries.

### Key Features

- 📊 **Sales Analytics** - Track revenue, orders, and performance metrics in real-time
- 🎯 **Campaign Management** - Monitor marketing campaigns across multiple channels
- 👥 **Customer Intelligence** - Analyze customer behavior, segments, and retention
- 🤖 **AI Assistant** - Natural language queries powered by Google Gemini
- 📈 **Automated Insights** - AI-generated recommendations and trend analysis
- 🔐 **Role-Based Access** - Multi-tenant with team collaboration
- 📤 **CSV Import/Export** - Bulk data import and templated exports
- 💬 **Conversation History** - Save and resume AI chat sessions

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│ (Vite+Tailwind) │
└────────┬────────┘
         │ REST API
         ↓
┌─────────────────┐
│  Express Server │
│  (JWT + Prisma) │
└─────┬──────┬────┘
      │      │
      ↓      ↓
┌──────┐  ┌──────────┐
│ Neon │  │  Upstash │
│  DB  │  │  Redis   │
└──────┘  └────┬─────┘
               │ Queue
               ↓
      ┌────────────────┐
      │  AI Worker     │
      │ (FastAPI +     │
      │  LangGraph +   │
      │  Gemini)       │
      └────────────────┘
```

### Data Flow

```
Frontend (React + Vite)
        ↓
API Server (Node.js + Express + Prisma)
   ↙                              ↘
PostgreSQL (NeonDB)          Redis (Upstash)
                                    ↓
                          AI Worker (Python + LangGraph)
                                    ↓
                          Google Gemini 2.5 Flash
```

### Services

- **Frontend** - React SPA with TailwindCSS
- **API Server** - Express REST API with JWT auth
- **AI Worker** - Python FastAPI service for AI queries
- **Database** - PostgreSQL (Neon serverless)
- **Cache/Queue** - Redis (Upstash)
- **Storage** - Google Cloud Storage

### Technology Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS + shadcn/ui
- React Router v6
- Recharts for visualizations

**Backend API:**
- Node.js + Express
- Prisma ORM
- JWT authentication
- Redis (Upstash)

**AI Worker:**
- Python + FastAPI
- LangChain + LangGraph
- Google Gemini 2.5 Flash
- SQLAlchemy

**Infrastructure:**
- PostgreSQL (Neon serverless)
- Redis (Upstash)
- Google Cloud Storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL (or Neon account)
- Redis (or Upstash account)
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/shihabshahrier/growth-monitor.git
cd growth-monitor
```

### 2. Setup Backend API

```bash
cd server/api

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Add your database URL, Redis URL, JWT secrets, etc.

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed demo data (optional)
npm run prisma:seed

# Start server
npm run dev
```

The API server will run on `http://localhost:8080`

### 3. Setup AI Worker

```bash
cd server/ai_worker

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with DATABASE_URL, REDIS_URL, GEMINI_API_KEY
cp .env.example .env

# Start worker
python main.py
```

The AI worker will run on `http://localhost:8000`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# VITE_API_URL=http://localhost:8080/api

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Access the application

**Demo credentials:**
- Email: `demo@growthmonitor.ai`
- Password: `password123`

## 📝 Environment Variables

### Backend API (.env)

```env
NODE_ENV=development
PORT=8080

DATABASE_URL=postgresql://user:password@host/database
REDIS_URL=rediss://default:password@host:6379

ACCESS_TOKEN_SECRET=your-secret-key-min-32-chars  # MUST CHANGE IN PRODUCTION
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars  # MUST CHANGE IN PRODUCTION
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Optional - GCP Storage
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
GCP_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

AI_API_URL=http://localhost:8000
```

### AI Worker (.env)

```env
DATABASE_URL=postgresql://user:password@host/database
REDIS_URL=rediss://default:password@host:6379

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8080/api
```

## 📦 Project Structure

```
growth-monitor/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
│
├── server/
│   ├── api/                 # Express API server
│   │   ├── prisma/          # Database schema & migrations
│   │   ├── src/
│   │   │   ├── controllers/ # Route handlers
│   │   │   ├── routes/      # API routes
│   │   │   ├── middlewares/ # Auth, RBAC, etc.
│   │   │   ├── services/    # Business logic
│   │   │   └── utils/       # Helper functions
│   │   └── package.json
│   │
│   └── ai_worker/           # Python AI service
│       ├── ai_pipeline.py   # LangGraph agent
│       ├── db.py            # Database queries
│       ├── queue_consumer.py # Redis job consumer
│       └── requirements.txt
│
└── templates/               # CSV templates
```

## 🔐 Authentication

JWT-based authentication with refresh tokens:

1. **Login** - Receive access token (15m) + refresh token (7d)
2. **Authorization** - `Authorization: Bearer <access_token>`
3. **Auto-refresh** - Silent token refresh on expiry
4. **Logout** - Refresh token blacklisted in Redis

### Token System

- **Access Token (short-lived, 15m)** - For all API requests
- **Refresh Token (long-lived, 7d)** - Stored in HTTP-only cookie
- **Blacklist Mechanism** - Revoked refresh tokens stored in Redis set: `revoked_tokens`

### Flow Summary

1. User logs in → receives both tokens
2. Access token used in headers (`Authorization: Bearer <token>`)
3. When expired → client silently calls `/auth/refresh`
4. Logout → refresh token added to Redis blacklist

## 🤖 AI Features

### Natural Language Queries

```
"Show me top 5 selling products"
"What were sales this month?"
"Which campaign performed best?"
"Show me customer retention rate"
```

### AI Tools

- Sales analysis (channel, region, time, product)
- Campaign performance tracking
- Customer segmentation & retention
- Time-series forecasting
- Automated insights

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### AI Chat
- `POST /api/ai/query` - Submit query (returns jobId)
- `GET /api/ai/stream/:jobId` - Stream response (SSE)

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation with messages
- `DELETE /api/conversations/:id` - Delete conversation

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/sales-trend` - Sales trend data
- `GET /api/analytics/campaign-performance` - Campaign metrics
- `GET /api/analytics/customer-segments` - Customer segments

### Team Management
- `GET /api/team` - List team members
- `POST /api/team/invite` - Invite team member
- `PUT /api/team/:id/role` - Update member role
- `DELETE /api/team/:id` - Remove team member

### CSV Operations
- `POST /api/csv/upload` - Upload CSV file
- `GET /api/csv/template/:type` - Download CSV template
- `POST /api/csv/export/:type` - Export data as CSV

## 🚢 Production Deployment

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Enable Redis persistence
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline

### Recommended Platforms

| Service | Platform Options |
|---------|------------------|
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Backend API | Render, Railway, Google Cloud Run |
| AI Worker | Google Cloud Run, AWS ECS |
| Database | Neon, Supabase, Railway |
| Redis | Upstash, Redis Cloud |
| Storage | Google Cloud Storage, AWS S3 |

### Docker Support

See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

Quick start with Docker Compose:

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Made with ❤️ for SMEs worldwide

---

📖 **Project page:** https://shihub.online/projects/growth-monitor
