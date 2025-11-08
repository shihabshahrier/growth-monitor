# GrowthMonitor - Testing Guide

## 🚀 Quick Start

Run all tests with a single command:

```bash
./run-all-tests.sh
```

This script will:
1. ✅ Clean up any processes on ports 8080, 5173, 5174, 8000
2. 🚀 Start the backend API server
3. 🌱 Seed the database with test data
4. 🎨 Start the frontend development server
5. 🧪 Run backend integration tests
6. 🤖 Run frontend automation tests
7. 📊 Generate a comprehensive test report
8. ⏸️ Keep servers running until you press Ctrl+C

## 📋 Prerequisites

### Backend
- Node.js 18+ and npm
- PostgreSQL database (NeonDB configured)
- Redis server (optional, for caching)

### Frontend
- Node.js 18+ and npm
- Modern web browser

### Automation Tests
- Python 3.10+
- Selenium WebDriver
- Chrome browser

Install Python dependencies:
```bash
pip3 install --break-system-packages selenium webdriver-manager
```

## 🧪 Test Components

### 1. Backend Integration Tests
**Location:** `server/api/tests/integration.test.js`

**What it tests:**
- ✅ Health check endpoint
- 🔐 Authentication (register, login, token refresh)
- 👥 Customer CRUD operations
- 💰 Sales CRUD operations
- 📢 Campaign management
- 📊 Analytics endpoints (overview, trends, channels, customers, campaigns)
- 💬 Conversations and messages
- 💡 Insights management
- 👨‍👩‍👧‍👦 Team management
- ❌ Error handling and validation

**Run manually:**
```bash
cd server/api
npm test
```

### 2. Frontend Automation Tests
**Location:** `test-frontend-automation.py`

**What it tests:**
- 🔐 Login with test credentials
- 🧭 Navigation to all main pages
- 👥 Customer operations (create, view)
- 💰 Sales operations (list, create)
- 📊 Analytics tabs and data visualization
- 💬 Chat functionality
- 💡 Insights page
- 👨‍👩‍👧‍👦 Team page
- 🚪 Logout

**Run manually:**
```bash
python3 test-frontend-automation.py http://localhost:5173
```

Screenshots are saved to `test-screenshots/` on failures.

## 📊 Test Data

The database is seeded with:
- 🏢 1 Company: "GrowthMonitor Demo"
- 👤 3 Users:
  - `demo@growthmonitor.ai` / `password123` (OWNER)
  - `admin@growthmonitor.ai` / `password123` (ADMIN)
  - `member@growthmonitor.ai` / `password123` (MEMBER)
- 👥 5 Customers (Acme Corp, Tech Startup, etc.)
- 📢 4 Campaigns (Summer Sale, Google Ads, LinkedIn, Social Media)
- 💰 50 Sales (distributed over 90 days)
- 💡 4 Insights (opportunity, warning, trend, recommendation)
- 💬 1 Conversation with messages
- 📝 Audit logs

## 🔧 Manual Testing

### Start Backend Only
```bash
cd server/api
npm run dev
```
Backend runs on: http://localhost:8080

### Start Frontend Only
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173 or 5174

### Seed Database
```bash
cd server/api
npm run prisma:seed
```

## 📝 Test Report

After running tests, you'll find:
- **Console output:** Real-time test results
- **Test report:** `test-report.txt` with summary
- **Backend log:** `backend.log`
- **Frontend log:** `frontend.log`
- **Screenshots:** `test-screenshots/` (on failures)

## 🐛 Troubleshooting

### Port Already in Use
The script automatically kills processes on required ports. If you see issues:
```bash
# Check what's using a port
lsof -ti:8080

# Kill manually
kill -9 $(lsof -ti:8080)
```

### Backend Tests Fail
1. Ensure database is accessible
2. Check `backend.log` for errors
3. Verify environment variables in `server/api/.env`

### Frontend Tests Fail
1. Check if Chrome browser is installed
2. Run in non-headless mode (edit `test-frontend-automation.py`)
3. Check screenshots in `test-screenshots/`
4. Verify frontend is accessible at the URL

### Database Issues
```bash
cd server/api
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 🎯 CI/CD Integration

For automated testing in CI/CD pipelines:

```bash
# Install dependencies
cd server/api && npm install
cd ../../frontend && npm install
cd ..

# Run tests (will exit with code 1 if any fail)
./run-all-tests.sh
```

## 📈 Success Metrics

**Production Ready Criteria:**
- ✅ Backend tests: 100% pass rate
- ✅ Frontend tests: 90%+ pass rate
- ✅ All critical user workflows functional
- ✅ Authentication and authorization working
- ✅ Database operations successful
- ✅ Analytics data loading correctly

## 🔐 Test Credentials

**Owner Account:**
- Email: `demo@growthmonitor.ai`
- Password: `password123`

**Admin Account:**
- Email: `admin@growthmonitor.ai`
- Password: `password123`

**Member Account:**
- Email: `member@growthmonitor.ai`
- Password: `password123`

## 📞 Support

If you encounter issues:
1. Check logs in `backend.log` and `frontend.log`
2. Review test output in console
3. Check screenshots in `test-screenshots/`
4. Ensure all dependencies are installed
5. Verify environment variables are set correctly

## 🎉 Expected Output

When everything works:
```
╔════════════════════════════════════════════════════╗
║   GrowthMonitor - Master Test Runner              ║
╚════════════════════════════════════════════════════╝

📋 Step 1: Cleaning up ports...
  ✓ Port 8080 is free
  ✓ Port 5173 is free
  ✓ Port 5174 is free
  ✓ Port 8000 is free

🚀 Step 2: Starting Backend API...
  ✓ Backend is ready (PID: 12345)

🌱 Step 3: Seeding Database...
  ✓ Database seeded successfully

🎨 Step 4: Starting Frontend...
  ✓ Frontend is ready on port 5173 (PID: 12346)

🧪 Step 5: Running Backend Integration Tests...
==========================================
  ✓ All 42 tests passed!

🤖 Step 6: Running Frontend Automation Tests...
==========================================
  ✓ All tests passed!

📊 Step 7: Generating Test Report...
==========================================
  Backend Tests:  ✓ PASSED
  Frontend Tests: ✓ PASSED

╔════════════════════════════════════════════════════╗
║   Test Summary                                     ║
╚════════════════════════════════════════════════════╝

  Backend Tests:  ✓ PASSED
  Frontend Tests: ✓ PASSED

✅ All tests passed!

🚀 Services are still running:
   Backend:  http://localhost:8080
   Frontend: http://localhost:5173

Press Ctrl+C to stop all services...
```

---

**Note:** The test runner keeps servers running after tests complete. This allows you to manually test the application after automated tests finish. Press `Ctrl+C` when you're done to stop all services.
