# 🚀 GrowthMonitor - Quick Start Guide

## One-Command Startup

```bash
./start.sh
```

That's it! The script will automatically:
- ✅ Create Python virtual environment if needed
- ✅ Install all dependencies (Node.js + Python)
- ✅ Create .env files from examples
- ✅ Start all three services
- ✅ Perform health checks

## Services

Once started, access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React web application |
| **API Server** | http://localhost:8080 | REST API backend |
| **AI Worker** | http://localhost:8000 | AI processing service |

## Stop All Services

```bash
./stop.sh
```

## View Logs

```bash
# Real-time logs
tail -f logs/frontend.log
tail -f logs/api_server.log
tail -f logs/ai_worker.log

# Or view all logs
tail -f logs/*.log
```

## First Time Setup

### 1. Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **PostgreSQL** database (or [Neon](https://neon.tech) account)
- **Redis** instance (or [Upstash](https://upstash.com) account)
- **Google Gemini API Key** ([Get one](https://makersuite.google.com/app/apikey))

### 2. Configure Environment Variables

After running `./start.sh` for the first time, update these files:

#### `server/api/.env`
```env
DATABASE_URL=your-postgresql-url
REDIS_URL=your-redis-url
ACCESS_TOKEN_SECRET=your-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
```

#### `server/ai_worker/.env`
```env
DATABASE_URL=your-postgresql-url
REDIS_URL=your-redis-url
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Database Migrations

```bash
cd server/api
npx prisma migrate deploy
npx prisma generate
```

### 4. (Optional) Seed Demo Data

```bash
cd server/api
npm run prisma:seed
```

### 5. Restart Services

```bash
./stop.sh
./start.sh
```

## Demo Credentials

After seeding:
- **Email:** demo@growthmonitor.ai
- **Password:** password123

## Troubleshooting

### Port Already in Use

The startup script will detect and offer to kill existing processes.

### Service Won't Start

Check logs:
```bash
cat logs/frontend.log
cat logs/api_server.log
cat logs/ai_worker.log
```

### Database Connection Error

1. Verify `DATABASE_URL` in `.env` files
2. Ensure PostgreSQL is running
3. Check network connectivity

### Redis Connection Error

1. Verify `REDIS_URL` in `.env` files
2. Ensure Redis is running
3. Check authentication credentials

### AI Worker Issues

1. Verify `GEMINI_API_KEY` is set
2. Check Python dependencies: `cd server/ai_worker && source .venv/bin/activate && pip list`
3. Test Gemini API: https://makersuite.google.com/app/apikey

## Manual Service Control

If you prefer to start services individually:

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API Server
```bash
cd server/api
npm install
npx prisma generate
npm run dev
```

### AI Worker
```bash
cd server/ai_worker
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Docker Alternative

If you prefer Docker:

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Health Checks

Verify all services are running:

```bash
# Frontend
curl http://localhost:5173

# API Server
curl http://localhost:8080/healthz

# AI Worker
curl http://localhost:8000/healthz
```

Expected response: `{"status":"ok"}`

## Common Commands

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh

# View all logs
tail -f logs/*.log

# Check running processes
ps aux | grep -E 'node|python|vite'

# Check ports
lsof -i :5173  # Frontend
lsof -i :8080  # API Server
lsof -i :8000  # AI Worker
```

## Project Structure

```
growth-monitor/
├── start.sh              # 🚀 Start all services
├── stop.sh               # 🛑 Stop all services
├── logs/                 # 📝 Service logs
├── frontend/             # React application
├── server/
│   ├── api/             # Express API server
│   └── ai_worker/       # Python AI service
└── templates/           # CSV templates
```

## Next Steps

1. ✅ Start services with `./start.sh`
2. ✅ Open http://localhost:5173
3. ✅ Login with demo credentials
4. ✅ Explore the dashboard
5. ✅ Try the AI chat feature
6. ✅ Import sample data via CSV

## Support

- 📖 Full documentation: [README.md](./README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/shihabshahrier/growth-monitor/issues)
- 📊 Analysis: [CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)
- 🐳 Docker guide: [DOCKER.md](./DOCKER.md)
- 🚀 Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Happy coding! 🎉**
