# 🚨 Critical Issues Found & Fixes

## Issue #1: Message Duplication After Refresh 🔴 CRITICAL

### **Problem:**
Messages appear multiple times after page refresh:
```
How many customers do I have?
You have a total of **15** customers.
You have a total of **15** customers.  ← DUPLICATE
```

### **Root Cause:**
`useEffect` in `ChatView.jsx` has `initialMessages` as dependency:

```javascript
useEffect(() => {
  if (initialMessages) {
    const loadedMessages = initialMessages.map(msg => ({
      ...msg,
      saved: true,
    }));
    setMessages(loadedMessages);
  }
}, [conversationId, initialMessages]); // ← initialMessages causes re-runs
```

**Why this causes duplicates:**
1. Parent component passes `initialMessages` array
2. Array is recreated on every parent render
3. Effect sees "new" array (different reference)
4. Messages are reset/reloaded
5. If messages are also being added via streaming, duplicates occur

### **Fix:**
Remove `initialMessages` from dependencies, only depend on `conversationId`:

```javascript
useEffect(() => {
  if (initialMessages) {
    const loadedMessages = initialMessages.map(msg => ({
      ...msg,
      saved: true,
    }));
    setMessages(loadedMessages);
  } else {
    setMessages([]);
  }
}, [conversationId]); // ← Only conversationId
```

Or use `useRef` to track if messages were already loaded for this conversation.

---

## Issue #2: Customer Retention Tool Failing 🔴 CRITICAL

### **Problem:**
```
User: "What's the customer retention rate?"
AI: "I am sorry, I cannot fulfill this request. The tool encountered 
     an error when trying to fetch the customer retention rate."
```

### **Root Cause:**
Customer tools are wrapped in `if company_id:` check (line 398), but the tool itself also checks `if not company_id:`. This means:

1. If `company_id` is `None`, tools are NOT added at all
2. AI doesn't have the tool available
3. AI tries to use it anyway → generic error

**Code:**
```python
# Line 398
if company_id:  # ← Customer tools only added if company_id exists
    def customer_retention_tool(_: str = "") -> str:
        if not company_id:  # ← Redundant check
            return "Unable to fetch..."
```

### **The Real Issue:**
`company_id` is probably `None` for the demo user!

**Check:**
```sql
SELECT u.email, u."companyId", c.name 
FROM "User" u 
LEFT JOIN "Company" c ON u."companyId" = c.id 
WHERE u.email = 'demo@growthmonitor.ai';
```

If `companyId` is NULL, customer tools won't be available.

### **Fix Options:**

**Option 1: Ensure demo user has company**
```sql
-- Find a company
SELECT id, name FROM "Company" LIMIT 1;

-- Assign to demo user
UPDATE "User" 
SET "companyId" = 'company-id-here' 
WHERE email = 'demo@growthmonitor.ai';
```

**Option 2: Make tools work without company_id**
```python
# Remove the if company_id: wrapper
# Make tools handle None gracefully
def customer_retention_tool(_: str = "") -> str:
    if not company_id:
        return "Customer retention data requires company context."
    # ... rest of code
```

---

## Issue #3: All Customer Tools Have Same Problem 🟡 HIGH

### **Affected Tools:**
- `customer_summary_tool` (line 399)
- `customer_segments_tool` (line 419)
- `customer_retention_tool` (line 439)
- `top_customers_tool` (line 469)

All wrapped in `if company_id:` block, so they're not available when `company_id` is None.

### **Sales Tools Work Because:**
They're wrapped in `if user_id:` (line 168), and `user_id` is always present for authenticated users.

---

## Issue #4: Context Not Being Logged 🟡 MEDIUM

### **Problem:**
When tools fail, we don't see what `company_id` and `user_id` values were passed.

### **Fix:**
Add logging at the start of `_build_tools`:

```python
def _build_tools(
    user_id: str | None,
    company_id: str | None,
    enriched_context: Dict[str, Any],
) -> List[Tool]:
    """Build comprehensive set of tools for the AI agent."""
    print(f"🔧 Building tools with:")
    print(f"   user_id: {user_id}")
    print(f"   company_id: {company_id}")
    print(f"   context keys: {list(enriched_context.keys())}")
    
    tools: List[Tool] = []
    # ... rest
```

---

## Issue #5: Message Save Race Condition Still Possible 🟡 MEDIUM

### **Problem:**
Even with our fixes, if user sends messages rapidly, there's still a small window for race conditions.

### **Better Fix:**
Use a queue or debounce for saves:

```javascript
const saveQueueRef = useRef([]);
const savingRef = useRef(false);

const handleSaveConversation = async (messages) => {
  saveQueueRef.current.push(messages);
  
  if (savingRef.current) return; // Already saving
  
  savingRef.current = true;
  while (saveQueueRef.current.length > 0) {
    const messagesToSave = saveQueueRef.current.shift();
    await actualSave(messagesToSave);
  }
  savingRef.current = false;
};
```

---

## 🎯 Priority Fixes

### **CRITICAL (Fix Now):**

1. **Message Duplication**
   - File: `frontend/src/components/chat/ChatView.jsx`
   - Line: 29
   - Fix: Remove `initialMessages` from useEffect dependencies

2. **Customer Retention Failing**
   - Check if demo user has `companyId`
   - If not, assign one
   - Or make tools handle None gracefully

### **HIGH (Fix Soon):**

3. **Add Context Logging**
   - File: `server/ai_worker/ai_pipeline.py`
   - Line: 153 (start of `_build_tools`)
   - Add logging for user_id and company_id

4. **Test All Customer Tools**
   - Verify they work with valid company_id
   - Add error handling to all

### **MEDIUM (Nice to Have):**

5. **Improve Save Queue**
   - Prevent rapid-fire save issues
   - Add debouncing

---

## 🧪 Testing Steps

### **Test 1: Message Duplication**
```
1. Send 3 messages
2. Refresh page (F5)
3. Check if messages appear once or multiple times
4. Expected: Each message appears ONCE
```

### **Test 2: Customer Retention**
```
1. Check demo user company:
   psql -U postgres -d growthmonitor
   SELECT "companyId" FROM "User" WHERE email = 'demo@growthmonitor.ai';

2. If NULL, assign company:
   UPDATE "User" SET "companyId" = (SELECT id FROM "Company" LIMIT 1) 
   WHERE email = 'demo@growthmonitor.ai';

3. Restart AI worker
4. Ask: "What's the customer retention rate?"
5. Expected: Should return data or "No retention data available"
```

### **Test 3: Context Logging**
```
1. Send any message
2. Check AI worker logs:
   tail -f logs/ai_worker.log
3. Expected: See user_id and company_id values
```

---

## 📊 Summary

| Issue | Severity | Status | Fix Complexity |
|-------|----------|--------|----------------|
| Message Duplication | 🔴 CRITICAL | Found | Easy (1 line) |
| Retention Tool Failing | 🔴 CRITICAL | Found | Medium (DB update) |
| Other Customer Tools | 🟡 HIGH | Found | Same as #2 |
| Missing Context Logs | 🟡 MEDIUM | Found | Easy (3 lines) |
| Save Race Condition | 🟡 MEDIUM | Mitigated | Medium (refactor) |

---

## 🚀 Quick Fixes

### **Fix #1: Message Duplication**
```javascript
// frontend/src/components/chat/ChatView.jsx line 29
}, [conversationId]); // Remove initialMessages
```

### **Fix #2: Check Demo User Company**
```bash
psql -U postgres -d growthmonitor -c "SELECT u.email, u.\"companyId\", c.name FROM \"User\" u LEFT JOIN \"Company\" c ON u.\"companyId\" = c.id WHERE u.email = 'demo@growthmonitor.ai';"
```

### **Fix #3: Assign Company if Missing**
```sql
UPDATE "User" 
SET "companyId" = (SELECT id FROM "Company" LIMIT 1) 
WHERE email = 'demo@growthmonitor.ai' AND "companyId" IS NULL;
```

---

**These are the root causes of both issues!** 🎯
