# 🚀 Production Deployment Guide

## Overview

GrowthMonitor can be deployed using Docker or directly to cloud platforms. This guide covers multiple deployment strategies.

## 📦 Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

Best for: Self-hosting on VPS (DigitalOcean, Linode, AWS EC2)

See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

**Quick Start:**
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with production credentials

# 2. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Option 2: Cloud Native (Serverless)

Best for: Scalable production with minimal ops

**Frontend → Vercel/Netlify**
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

**Backend API → Render/Railway**
```bash
# Connect GitHub repo
# Set environment variables
# Deploy from main branch
```

**AI Worker → Google Cloud Run**
```bash
cd server/ai_worker
gcloud run deploy growthmonitor-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Database → Neon** (already serverless)
**Redis → Upstash** (already serverless)

## 🔧 Environment Setup

### Required Services

1. **PostgreSQL Database**
   - Neon: https://neon.tech (recommended)
   - Supabase: https://supabase.com
   - Railway: https://railway.app

2. **Redis**
   - Upstash: https://upstash.com (recommended)
   - Redis Cloud: https://redis.com/cloud

3. **Google Gemini API**
   - Get API key: https://makersuite.google.com/app/apikey

4. **Google Cloud Storage** (Optional)
   - For file uploads
   - Create service account with Storage Admin role

### Environment Variables Checklist

```env
# CRITICAL - Must be set
✓ DATABASE_URL
✓ REDIS_URL
✓ ACCESS_TOKEN_SECRET (32+ characters)
✓ REFRESH_TOKEN_SECRET (32+ characters)
✓ GEMINI_API_KEY

# OPTIONAL - Only if using file uploads
○ GCP_PROJECT_ID
○ GCP_BUCKET_NAME
○ GCP_CLIENT_EMAIL
○ GCP_PRIVATE_KEY
```

## 🌐 Platform-Specific Guides

### Vercel (Frontend)

1. Connect GitHub repository
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables:
   ```
   VITE_API_URL=https://your-api.com/api
   ```

### Render (Backend API)

1. Create new Web Service
2. Connect GitHub repository
3. Build command: `npm install && npx prisma generate`
4. Start command: `node src/index.js`
5. Add environment variables from `.env.example`
6. Add health check path: `/healthz`

### Railway (Full Stack)

1. New Project → Deploy from GitHub
2. Add services:
   - PostgreSQL (built-in)
   - Redis (built-in)
   - Backend API
   - AI Worker
   - Frontend

3. Configure environment variables
4. Connect services via private networking

### Google Cloud Run (AI Worker)

```bash
# Build and deploy
gcloud run deploy growthmonitor-ai-worker \
  --source server/ai_worker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL,GEMINI_API_KEY=$GEMINI_API_KEY \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300
```

## 🔐 Security Hardening

### SSL/TLS
- Use Cloudflare for free SSL
- Or Let's Encrypt with certbot
- Enable HTTPS redirect

### Environment Secrets
```bash
# Never commit .env files
# Use platform secret managers:
# - Vercel: Environment Variables (encrypted)
# - Render: Environment Groups
# - Railway: Shared Variables
# - GCP: Secret Manager
```

### CORS Configuration
```javascript
// server/api/src/app.js
const allowedOrigins = [
  'https://yourapp.com',
  'https://www.yourapp.com'
];
```

### Rate Limiting
Already configured in `rateLimiter.middleware.js`:
- 100 requests per 15 minutes per IP
- Adjust as needed for your scale

## 📊 Monitoring & Logging

### Health Checks
All services expose health endpoints:
- API: `GET /healthz`
- AI Worker: `GET /`
- Frontend: `GET /health` (nginx)

### Logging
```bash
# Application logs
docker-compose logs -f api
docker-compose logs -f ai_worker

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis
```

### Monitoring Services
- **Uptime:** UptimeRobot, Better Uptime
- **APM:** New Relic, Datadog
- **Errors:** Sentry
- **Logs:** Logtail, Papertrail

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and test
        run: |
          npm install
          npm test
      
      - name: Deploy to production
        run: |
          # Your deployment script
```

## 📈 Scaling Considerations

### Database
- Use connection pooling (PgBouncer)
- Enable read replicas for heavy queries
- Regular VACUUM and ANALYZE

### Redis
- Enable persistence (AOF)
- Use Redis Cluster for high availability
- Monitor memory usage

### API Server
- Horizontal scaling with load balancer
- Use PM2 for process management
- Enable gzip compression

### AI Worker
- Queue-based architecture (already implemented)
- Add more workers for concurrent requests
- Use Redis as message broker

## 🚨 Troubleshooting

### Database Connection Fails
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Common issues:
# - SSL mode required: add ?sslmode=require
# - Firewall: whitelist your server IP
```

### Redis Connection Fails
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Should return: PONG
```

### AI Worker Not Responding
```bash
# Check logs
docker-compose logs ai_worker

# Verify Gemini API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
```

## 📋 Pre-Deployment Checklist

### Security
- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] Database backups configured

### Performance
- [ ] Frontend build optimized
- [ ] Database indexes created
- [ ] Redis persistence enabled
- [ ] CDN configured for static assets
- [ ] Gzip compression enabled

### Monitoring
- [ ] Health checks configured
- [ ] Error tracking setup (Sentry)
- [ ] Uptime monitoring enabled
- [ ] Log aggregation configured
- [ ] Alerting rules defined

### Documentation
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment runbook created
- [ ] Rollback procedure documented

## 🎯 Post-Deployment

1. **Smoke Test**
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] API endpoints respond
   - [ ] AI chat works
   - [ ] Database queries succeed

2. **Monitor**
   - Watch logs for errors
   - Check response times
   - Monitor resource usage
   - Verify health checks

3. **Backup**
   - Set up automated database backups
   - Export environment configuration
   - Document rollback procedure

## 📞 Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Search GitHub issues
4. Open new issue with logs

---

**Production Deployment Status: ✅ Ready**

All services are production-ready with:
- Multi-stage Docker builds
- Health checks
- Environment configuration
- Security best practices
- Monitoring hooks
