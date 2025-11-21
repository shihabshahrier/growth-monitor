# 🧪 Quick Test Guide

## Run All Tests

```bash
# Full integration test suite (recommended)
python3 test_integration.py

# Quick system health check
./test_system.sh

# Gemini API specific test
python3 test_gemini_api.py
```

---

## Test Results Summary

**Last Run:** November 21, 2025, 11:24 PM  
**Status:** ✅ ALL TESTS PASSED (20/20)

### What Gets Tested:

1. ✅ **Database** - PostgreSQL connection, tables, queries
2. ✅ **Redis** - Connection, operations, AI job queue
3. ✅ **API Server** - Health, authentication, endpoints
4. ✅ **AI Worker** - Health, Gemini API integration
5. ✅ **AI Query Flow** - End-to-end message processing
6. ✅ **Conversations** - CRUD operations, message persistence
7. ✅ **Frontend** - Accessibility, content loading

---

## Quick Checks

### Check if services are running:
```bash
lsof -i :8080  # API Server
lsof -i :8000  # AI Worker
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Check logs:
```bash
tail -f logs/api_server.log
tail -f logs/ai_worker.log
tail -f logs/frontend.log
```

### Restart services:
```bash
./stop.sh
./start.sh
```

---

## Expected Output

When all tests pass, you should see:

```
🎉 ALL INTEGRATION TESTS PASSED!

Your system is fully functional:
  • Frontend: http://localhost:5173
  • API: http://localhost:8080/api
  • AI Worker: http://localhost:8000

Login credentials:
  • Email: demo@growthmonitor.ai
  • Password: password123
```

---

## Troubleshooting

### If tests fail:

1. **Check services are running:**
   ```bash
   ps aux | grep node
   ps aux | grep python
   ```

2. **Check environment files exist:**
   ```bash
   ls -la server/api/.env
   ls -la server/ai_worker/.env
   ```

3. **Check database is accessible:**
   ```bash
   psql -U postgres -d growthmonitor -c "SELECT 1;"
   ```

4. **Check Redis is accessible:**
   ```bash
   redis-cli ping
   ```

5. **Restart everything:**
   ```bash
   ./stop.sh
   ./start.sh
   sleep 10
   python3 test_integration.py
   ```

---

## Performance Benchmarks

| Component | Expected Time | Status |
|-----------|--------------|--------|
| Database query | < 50ms | ✅ |
| Redis operation | < 10ms | ✅ |
| API health check | < 100ms | ✅ |
| Authentication | < 200ms | ✅ |
| AI query (full) | 10-15s | ✅ |
| Frontend load | < 200ms | ✅ |

---

## Test Coverage

- ✅ Database connectivity and queries
- ✅ Redis operations and queues
- ✅ API authentication and authorization
- ✅ All REST endpoints
- ✅ AI worker integration
- ✅ Gemini API connectivity
- ✅ Message streaming
- ✅ Conversation persistence
- ✅ Frontend accessibility
- ✅ End-to-end AI query flow

---

## Documentation

- **Full Test Report:** `TEST_REPORT.md`
- **Chat System Analysis:** `CHAT_SYSTEM_ANALYSIS.md`
- **Fixes Applied:** `CHAT_FIXES_APPLIED.md`
- **Setup Guide:** `AI_SETUP_GUIDE.md`

---

**All systems tested and verified! 🚀**
