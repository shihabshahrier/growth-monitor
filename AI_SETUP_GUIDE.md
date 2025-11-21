# 🤖 AI Chat Setup Guide

## Current Issues & Solutions

### Issue 1: Mock Mode Response ✅ FIXED

**Symptom:**
```
GrowthMonitor AI is running in mock mode.
Please configure GEMINI_API_KEY to enable live analysis.
```

**Cause:** GEMINI_API_KEY not configured in environment

**Solution:** Follow the setup steps below

---

### Issue 2: 429 Quota Exceeded Error ✅ FIXED

**Symptom:**
```
Encountered error while running agent: 429 Resource has been exhausted (e.g. check quota).
```

**Causes:**
1. Invalid or placeholder API key
2. Free tier quota limits reached
3. Experimental model (`gemini-2.0-flash-exp`) has stricter limits
4. Rate limiting from too many requests

**Solutions Applied:**
1. ✅ Improved error messages with clear instructions
2. ✅ Changed default model to stable `gemini-1.5-flash`
3. ✅ Added user-friendly error handling for different scenarios

---

## 🚀 Complete Setup Instructions

### Step 1: Get Gemini API Key

1. Visit **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select or create a project
5. Copy the generated API key

**Important:** Keep this key secure and never commit it to version control!

---

### Step 2: Configure AI Worker

**Option A: Using the existing .env file**

```bash
cd server/ai_worker
nano .env  # or use your preferred editor
```

Add/update these lines:
```env
# Database (use same as API server)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/growthmonitor

# Redis (use same as API server)
REDIS_URL=redis://localhost:6379

# Google Gemini API - ADD YOUR KEY HERE
GEMINI_API_KEY=AIzaSy...your-actual-key-here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
```

**Option B: Copy from example**

```bash
cd server/ai_worker
cp .env.example .env
nano .env  # Update GEMINI_API_KEY with your actual key
```

---

### Step 3: Verify Configuration

Check that your .env file has:
```bash
cd server/ai_worker
cat .env | grep GEMINI
```

Should show:
```
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
```

---

### Step 4: Restart Services

```bash
cd /path/to/growth-monitor
./stop.sh
./start.sh
```

Or restart just the AI worker:
```bash
# Kill AI worker
lsof -ti:8000 | xargs kill -9

# Start AI worker
cd server/ai_worker
source .venv/bin/activate
python main.py
```

---

### Step 5: Test AI Chat

1. Open **http://localhost:5173**
2. Login with:
   - Email: `demo@growthmonitor.ai`
   - Password: `password123`
3. Navigate to **AI Chat** section
4. Try a test query:
   ```
   Show me top 5 selling products
   ```

**Expected Result:** AI should respond with actual data from your database

---

## 🎯 Recommended Models

### gemini-1.5-flash (RECOMMENDED) ⭐
- **Speed:** Very fast
- **Cost:** Most economical
- **Quota:** Higher limits on free tier
- **Best for:** Production use, high-volume queries

### gemini-1.5-pro
- **Speed:** Moderate
- **Cost:** Higher
- **Quota:** Lower limits
- **Best for:** Complex analysis, detailed responses

### gemini-pro
- **Speed:** Moderate
- **Cost:** Moderate
- **Quota:** Standard limits
- **Best for:** General purpose, stable

---

## 🐛 Troubleshooting

### Error: "Mock mode"

**Check:**
```bash
cd server/ai_worker
cat .env | grep GEMINI_API_KEY
```

**Fix:** Ensure GEMINI_API_KEY is set to your actual key (not placeholder)

---

### Error: "429 Resource exhausted"

**Possible Causes:**

1. **Invalid API Key**
   ```bash
   # Test your API key
   curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
   ```

2. **Quota Exceeded**
   - Check quota at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Free tier limits: 60 requests/minute, 1,500 requests/day
   - **Solution:** Wait for quota reset or upgrade to paid tier

3. **Wrong Model**
   - Update `.env`:
     ```env
     GEMINI_MODEL=gemini-1.5-flash
     ```
   - Restart AI worker

---

### Error: "401 Unauthorized"

**Cause:** Invalid API key

**Fix:**
1. Generate new API key at https://makersuite.google.com/app/apikey
2. Update `server/ai_worker/.env`
3. Restart AI worker

---

### Error: "404 Model not found"

**Cause:** Model name incorrect or not available

**Fix:** Use one of these stable models:
```env
GEMINI_MODEL=gemini-1.5-flash
# or
GEMINI_MODEL=gemini-1.5-pro
# or
GEMINI_MODEL=gemini-pro
```

---

### AI Worker Not Starting

**Check logs:**
```bash
tail -f logs/ai_worker.log
```

**Common issues:**
1. **Port 8000 in use**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python dependencies missing**
   ```bash
   cd server/ai_worker
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database connection failed**
   - Verify DATABASE_URL in `.env`
   - Ensure PostgreSQL is running

---

## 📊 API Quota Management

### Free Tier Limits (Gemini API)

| Model | Requests/Minute | Requests/Day |
|-------|----------------|--------------|
| gemini-1.5-flash | 15 | 1,500 |
| gemini-1.5-pro | 2 | 50 |
| gemini-pro | 60 | 1,500 |

### Best Practices

1. **Use gemini-1.5-flash** for production (highest limits)
2. **Implement caching** for repeated queries
3. **Add rate limiting** on frontend
4. **Monitor usage** at Google Cloud Console
5. **Upgrade to paid tier** for production apps

---

## 🔧 Advanced Configuration

### Adjust Response Length

```env
GEMINI_MAX_OUTPUT_TOKENS=2048  # Default
# Increase for longer responses:
GEMINI_MAX_OUTPUT_TOKENS=4096
```

### Adjust Creativity

```env
GEMINI_TEMPERATURE=0.2  # Default (factual)
# Increase for more creative responses:
GEMINI_TEMPERATURE=0.7
```

### Enable Debug Logging

```bash
cd server/ai_worker
# Add to .env:
LOG_LEVEL=DEBUG
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] GEMINI_API_KEY is set in `server/ai_worker/.env`
- [ ] Model is set to `gemini-1.5-flash` (or other stable model)
- [ ] AI worker is running on port 8000
- [ ] No errors in `logs/ai_worker.log`
- [ ] Health check passes: `curl http://localhost:8000/healthz`
- [ ] Test query works in frontend
- [ ] Response is actual data (not mock mode)

---

## 📞 Support

### Check Logs
```bash
# AI Worker
tail -f logs/ai_worker.log

# API Server
tail -f logs/api_server.log

# All services
tail -f logs/*.log
```

### Useful Commands
```bash
# Restart all services
./stop.sh && ./start.sh

# Check if AI worker is running
curl http://localhost:8000/healthz

# Test Gemini API directly
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY"
```

### Resources
- **Gemini API Docs:** https://ai.google.dev/docs
- **Get API Key:** https://makersuite.google.com/app/apikey
- **Quota Management:** https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- **GitHub Issues:** https://github.com/shihabshahrier/growth-monitor/issues

---

## 🎉 Success!

Once configured, you should see responses like:

```
Here are your top 5 selling products:

#1. Women's Saree
   • Revenue: ৳245,000 (70 orders)
   • Average Order: ৳3,500
   • Category: Apparel

#2. Winter Jacket
   • Revenue: ৳168,000 (40 orders)
   • Average Order: ৳4,200
   • Category: Apparel

[... and so on]

**Key Takeaway:** Apparel category dominates with 65% of total revenue.
```

**Enjoy your AI-powered business intelligence! 🚀**
