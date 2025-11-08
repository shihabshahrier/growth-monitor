# 🚀 Quick Start - Testing Reference

## Access Points
- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:8080
- **Health Check:** http://localhost:8080/healthz

## Test Account
```
Email: demo@example.com
Password: Demo123456
Role: OWNER
```

## Key Features to Test

### ✅ Must Test (Critical)
1. **Login** → Use demo account or create new
2. **Dashboard** → See metrics overview
3. **Customers** → Create, Edit, Delete
4. **Sales** → Record sale with customer link
5. **Campaigns** → Create campaign with budget
6. **Analytics** → View all 5 tabs

### 📋 Should Test (Important)
7. **Chat** → Start conversation, send messages
8. **Conversations** → View history, resume chat
9. **Insights** → Generate and view AI insights
10. **Navigation** → All sidebar links work

### 🔧 Can Test (Optional)
11. **CSV Import** → Upload customer CSV
12. **Team** → Invite member, change roles
13. **Search** → Filter customers/sales
14. **Pagination** → Navigate pages

## Quick Test Flow (5 minutes)

```
1. Open http://localhost:5174
2. Login with demo@example.com / Demo123456
3. Dashboard → Check metrics visible ✓
4. Customers → Click "Add Customer" → Fill form → Save ✓
5. Sales → Click "Record Sale" → Select customer → Save ✓
6. Campaigns → Create campaign → Set budget → Save ✓
7. Analytics → Click through all 5 tabs ✓
8. Chat → Type "Hello" → Get AI response ✓
```

## Known Requirements

### For Full Functionality
- ✅ Backend API must be running (port 8080)
- ✅ Frontend dev server must be running (port 5174)
- ⚠️ AI Worker needed for Chat & Insights (port 8000)
- ⚠️ Redis needed for imports & caching
- ⚠️ PostgreSQL with seeded data recommended

### For Testing AI Features
```bash
# Start AI Worker (in separate terminal)
cd server/ai_worker
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python main.py
```

## Debug Console Errors

### Open Browser DevTools
- **Chrome/Edge:** `Cmd+Option+J` (Mac) or `Ctrl+Shift+J` (Windows)
- **Firefox:** `Cmd+Option+K` (Mac) or `Ctrl+Shift+K` (Windows)
- **Safari:** `Cmd+Option+C` (Mac)

### Check Console for:
- ❌ Red errors (API failures, JS errors)
- ⚠️ Yellow warnings (can usually ignore)
- 🔵 Blue info (network requests)

## Common Issues

| Issue | Solution |
|-------|----------|
| Can't login | Clear localStorage, try again |
| Blank dashboard | Create some data first |
| Charts empty | Need sales/customers data |
| Chat not working | Start AI worker on port 8000 |
| Import stuck | Check Redis connection |
| 401 Unauthorized | Token expired, logout and login |

## Create Test Data via API

```bash
# Save this as test-data.sh and run it

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123456"}' | \
  jq -r '.accessToken')

echo "Token: $TOKEN"

# Create 3 customers
for i in {1..3}; do
  curl -s -X POST http://localhost:8080/api/customers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Customer $i\",\"email\":\"customer$i@test.com\",\"phone\":\"123456789$i\"}"
  echo "Created Customer $i"
done

# Get first customer ID
CUSTOMER_ID=$(curl -s http://localhost:8080/api/customers \
  -H "Authorization: Bearer $TOKEN" | \
  jq -r '.data[0].id')

echo "Customer ID: $CUSTOMER_ID"

# Create 5 sales
for i in {1..5}; do
  AMOUNT=$((500 + i * 100))
  curl -s -X POST http://localhost:8080/api/sales \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":$AMOUNT,\"customerId\":\"$CUSTOMER_ID\",\"channel\":\"Website\",\"product\":\"Service $i\"}"
  echo "Created Sale $i - \$$AMOUNT"
done

# Create 2 campaigns
curl -s -X POST http://localhost:8080/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Email Campaign","type":"Email","status":"active","budget":5000,"channel":"Email"}'
echo "Created Email Campaign"

curl -s -X POST http://localhost:8080/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Social Media Campaign","type":"Social","status":"active","budget":3000,"channel":"Social"}'
echo "Created Social Campaign"

echo "✅ Test data created!"
```

## Report Bugs

Found a bug? Document it:

```markdown
**Bug:** [Title]
**Page:** /path/to/page
**Steps:**
1. Click X
2. Type Y
3. See error

**Expected:** Should do Z
**Actual:** Does W instead
**Console Error:** [Paste from DevTools]
```

## Full Testing Guide

See `TESTING_GUIDE.md` for comprehensive test cases (150+ tests)

## Status Check

```bash
# Check if all services running
curl -s http://localhost:8080/healthz && echo "✅ Backend OK"
curl -s http://localhost:5174 | head -1 && echo "✅ Frontend OK"
curl -s http://localhost:8000/health && echo "✅ AI Worker OK" || echo "⚠️ AI Worker not running"
```

---

**Ready to test?** Open http://localhost:5174 and follow the Quick Test Flow above!
