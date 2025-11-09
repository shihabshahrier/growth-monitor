# Docker Deployment Guide

## Quick Start with Docker Compose

### Local Development

```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit .env and add your credentials (especially GEMINI_API_KEY)

# 3. Start all services
docker-compose up -d

# 4. Check service health
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Run database migrations
docker-compose exec api npx prisma migrate deploy

# 7. Seed demo data (optional)
docker-compose exec api npm run prisma:seed
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- AI Worker: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Deployment

```bash
# 1. Create .env file with production credentials
cp .env.example .env

# Edit .env with:
# - External DATABASE_URL (Neon, Supabase, etc.)
# - External REDIS_URL (Upstash, Redis Cloud, etc.)
# - Strong JWT secrets (32+ characters)
# - Production GCP credentials
# - GEMINI_API_KEY

# 2. Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

## Individual Service Commands

### Backend API

```bash
# Development
docker-compose up api

# Production build
docker-compose -f docker-compose.prod.yml up api --build

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Generate Prisma client
docker-compose exec api npx prisma generate

# Access shell
docker-compose exec api sh
```

### AI Worker

```bash
# Development
docker-compose up ai_worker

# Production build
docker-compose -f docker-compose.prod.yml up ai_worker --build

# View logs
docker-compose logs -f ai_worker

# Access Python shell
docker-compose exec ai_worker python
```

### Frontend

```bash
# Development (hot reload)
docker-compose up frontend

# Production build (nginx)
docker-compose -f docker-compose.prod.yml up frontend --build

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f frontend
```

## Database Management

### Backup Database

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres growthmonitor > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres growthmonitor < backup.sql
```

### Redis Data

```bash
# Save Redis snapshot
docker-compose exec redis redis-cli SAVE

# View Redis data
docker-compose exec redis redis-cli KEYS '*'
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs [service_name]

# Rebuild without cache
docker-compose build --no-cache [service_name]

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d growthmonitor
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "8081:8080"  # Changed from 8080:8080
```

## Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose ps

# Healthy services show (healthy) status
# Unhealthy services show (unhealthy) status
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Full cleanup
docker system prune -a --volumes
```

## Production Checklist

- [ ] Use external managed database (Neon, Supabase)
- [ ] Use external managed Redis (Upstash, Redis Cloud)
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL (use reverse proxy like Traefik or nginx)
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure log aggregation (Loki, ELK)
- [ ] Set up automated backups
- [ ] Configure resource limits in docker-compose
- [ ] Use secrets management (Docker secrets, Vault)
- [ ] Enable rate limiting
- [ ] Set up CI/CD pipeline

## Resource Limits (Production)

Add to `docker-compose.prod.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Environment Variables

See `.env.example` for all required environment variables.

### Critical Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `ACCESS_TOKEN_SECRET` - JWT access token secret (32+ chars)
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret (32+ chars)
- `GEMINI_API_KEY` - Google Gemini API key

### Optional Variables:
- `GCP_*` - Google Cloud Storage credentials (if using file uploads)
- `GEMINI_MODEL` - AI model to use (default: gemini-2.0-flash-exp)
- `GEMINI_TEMPERATURE` - AI creativity (0.0-1.0, default: 0.2)
