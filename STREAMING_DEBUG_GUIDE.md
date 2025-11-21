# 🐛 Streaming Issue Debug Guide

## Issue Reported
**Problem:** AI response received but UI still shows loading/processing state, can't send new messages.

---

## 🔍 What We Fixed

### 1. **Added Better Logging**

**Backend (`ai.controller.js`):**
- Now logs when stream closes: `"✅ Finished streaming job {jobId} - closing connection"`
- Logs early disconnections: `"⚠️ Stream connection closed early"`
- Logs stream errors

**Frontend (`useAIStream.js`):**
- Logs each received event: `"📨 Received stream event: DONE"` or `"content (X chars)"`
- Logs when onDone is called: `"✅ Stream completed, calling onDone"`

### 2. **Improved Error Handling**
- Added error event listener on backend stream
- Better cleanup on parsing errors
- Proper interval clearing

---

## 🧪 How to Test & Debug

### Step 1: Open Browser Console
```
1. Open http://localhost:5173
2. Login: demo@growthmonitor.ai / password123
3. Open browser DevTools (F12)
4. Go to Console tab
```

### Step 2: Send Test Message
```
Send: "What's my total revenue?"
```

### Step 3: Watch Console Logs

**You should see:**
```
📨 Received stream event: content (33 chars)
✅ Stream completed, calling onDone
```

**If you DON'T see "✅ Stream completed":**
- The `done` event is not being received
- Stream is hanging

### Step 4: Check Backend Logs
```bash
tail -f logs/api_server.log
```

**You should see:**
```
📤 Sending response (33 chars) for job {jobId}
✅ Finished streaming job {jobId} - closing connection
```

**If you see:**
```
⚠️ Stream connection closed early for job {jobId}
```
- Frontend disconnected before receiving done event

---

## 🔧 Debugging Steps

### If Stream Hangs:

#### 1. **Check Redis Queue**
```bash
# Install redis-cli if not available
brew install redis

# Check if done message is in Redis
redis-cli LRANGE ai_stream:{jobId} 0 -1
```

**Expected:** Should be empty (all messages consumed)

#### 2. **Check Network Tab**
```
1. Open DevTools → Network tab
2. Filter: "stream"
3. Look for /api/stream/{jobId} request
4. Check if it shows "pending" or "finished"
```

**If pending:** Stream connection is still open
**If finished:** Frontend should have received done event

#### 3. **Check Frontend State**
```javascript
// In browser console, check:
console.log("Is streaming:", document.querySelector('[data-streaming]'))
```

#### 4. **Force Refresh**
```
Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Done Event Not Received

**Symptoms:**
- Response appears in chat
- Loading spinner still showing
- Can't send new messages

**Check:**
```bash
# Backend logs
tail -f logs/api_server.log | grep "Finished streaming"

# Should see: ✅ Finished streaming job {jobId} - closing connection
```

**Solution:**
- If backend logs show "Finished" but frontend still loading
- Check browser console for "✅ Stream completed"
- If not there, it's a frontend parsing issue

### Issue 2: Multiple Stream Requests

**Symptoms:**
- Multiple GET requests to same stream endpoint
- Duplicate responses

**Check:**
```bash
# Backend logs
tail -f logs/api_server.log | grep "GET /api/ai/stream"
```

**Solution:**
- Frontend might be retrying
- Check for network errors in console
- Clear browser cache

### Issue 3: Stream Timeout

**Symptoms:**
- Error after 2 minutes
- "Stream timeout" message

**Check:**
```javascript
// In useAIStream.js
const streamTimeout = 120000; // 2 minutes
```

**Solution:**
- Increase timeout if AI queries take longer
- Or optimize AI worker response time

### Issue 4: Race Condition

**Symptoms:**
- Sometimes works, sometimes hangs
- Inconsistent behavior

**Check:**
```bash
# AI Worker logs
tail -f logs/ai_worker.log | grep "completed successfully"
```

**Solution:**
- Ensure AI worker sends done message
- Check Redis message order

---

## 🔍 Manual Debug Test

### Test Script:
```javascript
// Paste in browser console after sending message

// 1. Check if streaming state is stuck
const chatView = document.querySelector('[data-testid="chat-view"]');
console.log("Streaming state:", chatView?.dataset?.streaming);

// 2. Force clear streaming state (temporary fix)
// Note: This is just for debugging, not a real fix
window.location.reload();
```

---

## 📊 Expected Flow

### Normal Flow:
```
1. User sends message
   → Frontend: setIsStreaming(true)
   
2. Backend receives query
   → API: POST /api/ai/query → returns jobId
   
3. Frontend starts streaming
   → Frontend: GET /api/ai/stream/{jobId}
   
4. AI Worker processes
   → Worker: Generates response
   → Worker: Pushes to Redis: {content: "..."}
   → Worker: Pushes to Redis: {done: true}
   
5. Backend streams to frontend
   → API: Pops from Redis → sends content
   → API: Pops from Redis → sends done
   → API: Calls res.end()
   
6. Frontend receives events
   → Frontend: onChunk(content)
   → Frontend: onDone({done: true})
   → Frontend: setIsStreaming(false)
   
7. User can send new message ✅
```

### If Hanging:
```
Steps 1-5 complete ✅
Step 6: onDone never called ❌
Step 7: Still streaming, can't send ❌
```

---

## 🚨 Quick Fixes

### Fix 1: Force Stop Streaming (Frontend)
```javascript
// In browser console:
localStorage.clear();
window.location.reload();
```

### Fix 2: Clear Redis Queue
```bash
redis-cli FLUSHDB
# Warning: This clears ALL Redis data
```

### Fix 3: Restart Services
```bash
./stop.sh
./start.sh
```

### Fix 4: Check for JavaScript Errors
```
Open Console → Look for red errors
Common: "Cannot read property of undefined"
```

---

## 📝 What to Report

If issue persists, provide:

1. **Browser console logs** (copy all logs)
2. **Backend logs:**
   ```bash
   tail -50 logs/api_server.log
   ```
3. **AI Worker logs:**
   ```bash
   tail -50 logs/ai_worker.log
   ```
4. **Network tab screenshot** (showing stream request)
5. **Exact steps to reproduce**

---

## ✅ Success Indicators

After fix, you should see:

**Browser Console:**
```
📨 Received stream event: content (33 chars)
✅ Stream completed, calling onDone
```

**Backend Logs:**
```
📤 Sending response (33 chars) for job abc123...
✅ Finished streaming job abc123 - closing connection
```

**UI Behavior:**
- ✅ Response appears in chat
- ✅ Loading spinner disappears
- ✅ Input field enabled
- ✅ Can send new message immediately

---

## 🎯 Next Steps

1. **Test with logging enabled** (already done)
2. **Send test message:** "What's my total revenue?"
3. **Check browser console** for the logs
4. **Report what you see** in console

The logs will tell us exactly where the stream is breaking!
