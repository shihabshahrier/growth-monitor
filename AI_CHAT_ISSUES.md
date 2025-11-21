# AI Chat Issues - Analysis & Solutions

## 🐛 Issues Identified

### 1. **Mock Mode Response** ✅
**Issue:** AI is running in mock mode instead of using Gemini API.

**Root Cause:**
```python
# server/ai_worker/ai_pipeline.py line 572-576
except RuntimeError:
    chunks = _mock_response(query, enriched_context)
    for chunk in chunks:
        yield chunk
    return
```

The `_build_model()` function throws a `RuntimeError` when `GEMINI_API_KEY` is not set:
```python
# line 68-70
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")
```

**Solution:** Set the `GEMINI_API_KEY` in `server/ai_worker/.env`

---

### 2. **429 Resource Exhausted Error** ❌
**Issue:** `429 Resource has been exhausted (e.g. check quota).`

**Root Cause:**
- Gemini API free tier has rate limits
- Default model `gemini-2.0-flash-exp` may have stricter limits
- Error occurs at line 683 in `ai_pipeline.py` when calling the agent

**Possible Causes:**
1. **API Key Invalid** - Using placeholder key
2. **Quota Exceeded** - Free tier limits reached
3. **Rate Limiting** - Too many requests in short time
4. **Model Not Available** - `gemini-2.0-flash-exp` may not be accessible

**Solutions:**
1. Get a valid Gemini API key from https://makersuite.google.com/app/apikey
2. Switch to a more stable model like `gemini-1.5-flash` or `gemini-pro`
3. Add retry logic with exponential backoff
4. Implement request queuing/throttling

---

### 3. **Error Handling in Frontend** ⚠️
**Issue:** Error message shows in chat but doesn't provide user-friendly guidance.

**Current Behavior:**
```
Encountered error while running agent: 429 Resource has been exhausted (e.g. check quota).
```

**Improvement Needed:**
- Better error messages for users
- Retry mechanism
- Fallback to mock mode with helpful message

---

## 🔧 Solutions

### Solution 1: Configure Gemini API Key

**Step 1:** Get API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create or select a project
3. Generate API key

**Step 2:** Update Environment File
```bash
cd server/ai_worker
nano .env  # or use your editor
```

Add:
```env
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
```

**Step 3:** Restart AI Worker
```bash
cd /path/to/growth-monitor
./stop.sh
./start.sh
```

---

### Solution 2: Switch to Stable Model

The current model `gemini-2.0-flash-exp` is experimental. Switch to stable version:

**Update `.env`:**
```env
GEMINI_MODEL=gemini-1.5-flash
# or
GEMINI_MODEL=gemini-pro
```

**Available Models:**
- `gemini-1.5-flash` - Fast, cost-effective (RECOMMENDED)
- `gemini-1.5-pro` - More capable, slower
- `gemini-pro` - Stable, general purpose

---

### Solution 3: Add Better Error Handling

I'll update the AI pipeline to handle errors more gracefully.

---

### Solution 4: Implement Retry Logic

Add exponential backoff for API calls to handle rate limits.

---

## 📝 Implementation

Let me implement the fixes now...
