# 🧪 GrowthMonitor Frontend Testing Guide

## 🚀 Quick Start

**Frontend URL:** http://localhost:5174
**Backend API:** http://localhost:8080
**Status:** ✅ Both servers running

### Test Account Created
- **Email:** demo@example.com
- **Password:** Demo123456
- **Role:** OWNER

---

## 📋 Systematic Testing Checklist

### 1️⃣ Authentication Flow (Priority: HIGH)

#### Test 1.1: Login with Demo Account
- [ ] Navigate to http://localhost:5174
- [ ] Should redirect to `/auth` (login page)
- [ ] Enter email: `demo@example.com`
- [ ] Enter password: `Demo123456`
- [ ] Click "Continue"
- [ ] **Expected:** Redirect to dashboard (`/`)
- [ ] **Expected:** See "Welcome back!" toast notification

#### Test 1.2: Register New Account
- [ ] On login page, click "Sign up" link
- [ ] Enter name: "Test User 2"
- [ ] Enter email: "test2@example.com"
- [ ] Enter password: "Test123456"
- [ ] Click "Continue"
- [ ] **Expected:** Account created, redirect to dashboard
- [ ] **Expected:** See "Account created!" toast notification

#### Test 1.3: Logout
- [ ] Click user menu (top right corner)
- [ ] Click "Logout"
- [ ] **Expected:** Redirect to `/auth`
- [ ] **Expected:** Cannot access dashboard without login

#### Test 1.4: Invalid Login
- [ ] Try login with wrong password
- [ ] **Expected:** See error toast "Authentication failed"
- [ ] **Expected:** Stay on login page

---

### 2️⃣ Navigation & Layout (Priority: HIGH)

#### Test 2.1: Sidebar Navigation
- [ ] Login successfully
- [ ] Check all navigation items visible:
  - [ ] Dashboard (Home icon)
  - [ ] Customers (Users icon)
  - [ ] Sales (DollarSign icon)
  - [ ] Campaigns (Megaphone icon)
  - [ ] Analytics (BarChart icon)
  - [ ] Insights (Lightbulb icon)
  - [ ] Conversations (MessageSquare icon)
  - [ ] Chat (Bot icon)
  - [ ] Imports (Upload icon)
  - [ ] Team (Users icon)
  - [ ] Settings (disabled/grayed out)

#### Test 2.2: Active Navigation State
- [ ] Click each nav item
- [ ] **Expected:** Active item highlighted with primary color background
- [ ] **Expected:** Page content changes correctly

#### Test 2.3: Responsive Behavior
- [ ] Resize browser window to mobile size
- [ ] **Expected:** Sidebar still accessible (check mobile menu if implemented)

---

### 3️⃣ Dashboard Overview (Priority: HIGH)

#### Test 3.1: Dashboard Metrics
- [ ] Navigate to Dashboard (`/`)
- [ ] **Expected:** See 4 metric cards:
  - Total Revenue
  - Total Sales
  - Active Campaigns
  - Total Customers
- [ ] **Note:** Values may be $0 / 0 if no data exists yet

#### Test 3.2: Quick Actions
- [ ] Check quick action buttons visible:
  - [ ] "New Customer"
  - [ ] "Record Sale"
  - [ ] "Create Campaign"
  - [ ] "View Analytics"
- [ ] Click "New Customer"
- [ ] **Expected:** Navigate to `/customers/new`

---

### 4️⃣ Customer Management (Priority: HIGH)

#### Test 4.1: Create Customer
- [ ] Navigate to Customers (`/customers`)
- [ ] Click "Add Customer" button
- [ ] Fill form:
  - Name: "John Doe"
  - Email: "john@example.com"
  - Phone: "+1234567890"
  - Address: "123 Main St"
  - Tags: "vip,enterprise" (optional)
- [ ] Click "Create Customer"
- [ ] **Expected:** Redirect to customer detail page
- [ ] **Expected:** See success toast

#### Test 4.2: View Customer List
- [ ] Navigate to `/customers`
- [ ] **Expected:** See customer cards/table
- [ ] **Expected:** See the customer you just created
- [ ] Check pagination controls (if >10 customers)

#### Test 4.3: View Customer Detail
- [ ] Click on a customer card
- [ ] **Expected:** Navigate to `/customers/:id`
- [ ] **Expected:** See customer information displayed
- [ ] **Expected:** See "Edit" and "Delete" buttons

#### Test 4.4: Edit Customer
- [ ] On customer detail page, click "Edit"
- [ ] Update name to "John Doe Updated"
- [ ] Click "Save Changes"
- [ ] **Expected:** See success toast
- [ ] **Expected:** Name updated on detail page

#### Test 4.5: Delete Customer
- [ ] On customer detail page, click "Delete"
- [ ] **Expected:** See confirmation dialog
- [ ] Click "Delete" in dialog
- [ ] **Expected:** Redirect to customers list
- [ ] **Expected:** Customer removed from list

#### Test 4.6: Search Customers
- [ ] Create multiple customers with different names
- [ ] Use search bar to find specific customer
- [ ] **Expected:** List filters in real-time

---

### 5️⃣ Sales Management (Priority: HIGH)

#### Test 5.1: Create Sale
- [ ] Navigate to Sales (`/sales`)
- [ ] Click "Record Sale"
- [ ] Fill form:
  - Amount: 500
  - Select Customer: (choose from dropdown)
  - Date: (today)
  - Campaign: (select if available)
  - Channel: "Website"
  - Product/Service: "Premium Plan"
  - Notes: "Test sale"
- [ ] Click "Record Sale"
- [ ] **Expected:** Redirect to sales list
- [ ] **Expected:** See new sale in list

#### Test 5.2: View Sales List
- [ ] Navigate to `/sales`
- [ ] **Expected:** See sales in table format
- [ ] **Expected:** Each sale shows: amount, customer, date, channel
- [ ] Check sorting by clicking column headers

#### Test 5.3: Filter Sales
- [ ] Use date range picker to filter by date
- [ ] Filter by channel (dropdown)
- [ ] Filter by campaign (dropdown)
- [ ] **Expected:** List updates based on filters

#### Test 5.4: Edit Sale
- [ ] Click "Edit" on a sale
- [ ] Update amount to 750
- [ ] Click "Save"
- [ ] **Expected:** Amount updated in list

#### Test 5.5: Delete Sale
- [ ] Click "Delete" on a sale
- [ ] Confirm deletion
- [ ] **Expected:** Sale removed from list

---

### 6️⃣ Campaign Management (Priority: HIGH)

#### Test 6.1: Create Campaign
- [ ] Navigate to Campaigns (`/campaigns`)
- [ ] Click "Create Campaign"
- [ ] Fill form:
  - Name: "Summer Sale 2025"
  - Type: "Email"
  - Status: "Active"
  - Start Date: (today)
  - End Date: (30 days from now)
  - Budget: 5000
  - Target: "Generate 100 leads"
  - Channel: "Email"
- [ ] Click "Create Campaign"
- [ ] **Expected:** See success toast
- [ ] **Expected:** Campaign appears in list

#### Test 6.2: View Campaign Detail
- [ ] Click on campaign card
- [ ] **Expected:** Navigate to `/campaigns/:id`
- [ ] **Expected:** See campaign details, metrics, and progress

#### Test 6.3: Edit Campaign
- [ ] On campaign detail, click "Edit"
- [ ] Update budget to 7500
- [ ] Change status to "Paused"
- [ ] Click "Save Changes"
- [ ] **Expected:** See updated values

#### Test 6.4: Campaign Metrics
- [ ] On campaign detail page
- [ ] **Expected:** See metrics cards (if sales linked):
  - Total Revenue
  - Number of Sales
  - Average Sale Value
  - ROI percentage

---

### 7️⃣ Analytics Dashboard (Priority: HIGH)

#### Test 7.1: Overview Tab
- [ ] Navigate to Analytics (`/analytics`)
- [ ] **Expected:** See "Overview" tab active by default
- [ ] **Expected:** See metric cards at top
- [ ] **Expected:** See revenue chart (line/bar chart)
- [ ] **Expected:** See sales by channel (pie/bar chart)

#### Test 7.2: Trends Tab
- [ ] Click "Trends" tab
- [ ] **Expected:** See time-series charts
- [ ] **Expected:** See trend comparison (MoM, YoY)
- [ ] Use date range picker to change period
- [ ] **Expected:** Charts update accordingly

#### Test 7.3: Channels Tab
- [ ] Click "Channels" tab
- [ ] **Expected:** See channel performance breakdown
- [ ] **Expected:** See channel comparison table
- [ ] **Expected:** See charts for each channel

#### Test 7.4: Customers Tab
- [ ] Click "Customers" tab
- [ ] **Expected:** See customer analytics:
  - New customers over time
  - Customer segments
  - Top customers by revenue
  - Customer retention metrics

#### Test 7.5: Campaigns Tab
- [ ] Click "Campaigns" tab
- [ ] **Expected:** See campaign performance:
  - Campaign comparison table
  - ROI metrics
  - Budget vs. actual spend
  - Top performing campaigns

---

### 8️⃣ AI Chat & Conversations (Priority: MEDIUM)

#### Test 8.1: Start New Chat
- [ ] Navigate to Chat (`/chat`)
- [ ] **Expected:** See chat interface
- [ ] Type message: "What are my top customers?"
- [ ] Press Enter or click Send
- [ ] **Expected:** See loading indicator
- [ ] **Expected:** Receive AI response
- [ ] **Note:** Requires AI worker to be running

#### Test 8.2: Chat Persistence
- [ ] Send multiple messages in chat
- [ ] Navigate away to another page
- [ ] Return to Chat page
- [ ] **Expected:** Previous conversation still visible
- [ ] Click "New Conversation"
- [ ] **Expected:** Fresh chat started

#### Test 8.3: View Conversations List
- [ ] Navigate to Conversations (`/conversations`)
- [ ] **Expected:** See list of all previous conversations
- [ ] **Expected:** See conversation titles/previews
- [ ] Click on a conversation
- [ ] **Expected:** Navigate to `/chat/:id` with that conversation loaded

#### Test 8.4: Delete Conversation
- [ ] On conversations list, click delete icon
- [ ] Confirm deletion
- [ ] **Expected:** Conversation removed from list

---

### 9️⃣ CSV Import Wizard (Priority: MEDIUM)

#### Test 9.1: Start Import
- [ ] Navigate to Imports (`/imports`)
- [ ] Click "New Import"
- [ ] **Expected:** Navigate to `/imports/new` (wizard)

#### Test 9.2: Upload CSV
- [ ] Create test CSV file with customers:
  ```csv
  name,email,phone,address
  Alice Smith,alice@test.com,1234567890,123 Oak St
  Bob Johnson,bob@test.com,0987654321,456 Pine St
  ```
- [ ] Select "Customers" as import type
- [ ] Upload the CSV file
- [ ] Click "Next"
- [ ] **Expected:** Move to mapping step

#### Test 9.3: Map Columns
- [ ] Map CSV columns to database fields:
  - name → Name
  - email → Email
  - phone → Phone
  - address → Address
- [ ] Click "Next"
- [ ] **Expected:** Move to preview step

#### Test 9.4: Preview & Validate
- [ ] **Expected:** See preview of data to be imported
- [ ] **Expected:** See validation status (valid/invalid rows)
- [ ] Click "Next"
- [ ] **Expected:** Move to confirmation step

#### Test 9.5: Start Import Job
- [ ] Review import summary
- [ ] Click "Start Import"
- [ ] **Expected:** Import job created
- [ ] **Expected:** See job status tracking
- [ ] **Expected:** Progress updates in real-time

#### Test 9.6: View Import History
- [ ] Navigate to `/imports`
- [ ] **Expected:** See list of all import jobs
- [ ] **Expected:** See status (pending/processing/completed/failed)
- [ ] Click on import job
- [ ] **Expected:** See detailed job status and logs

---

### 🔟 Team Management (Priority: MEDIUM)

#### Test 10.1: View Team Members
- [ ] Navigate to Team (`/team`)
- [ ] **Expected:** See list of team members
- [ ] **Expected:** See your account as OWNER

#### Test 10.2: Invite Team Member
- [ ] Click "Invite Member"
- [ ] Fill form:
  - Email: "newmember@example.com"
  - Role: "MEMBER"
- [ ] Click "Send Invitation"
- [ ] **Expected:** See success toast
- [ ] **Expected:** Invitation appears in pending list
- [ ] **Note:** Check email for invitation (requires email service configured)

#### Test 10.3: Change Member Role
- [ ] Find a team member (not yourself)
- [ ] Click "Change Role"
- [ ] Select "ADMIN"
- [ ] Confirm change
- [ ] **Expected:** Role updated

#### Test 10.4: Remove Team Member
- [ ] Click "Remove" on a member
- [ ] Confirm removal
- [ ] **Expected:** Member removed from team

#### Test 10.5: Company Settings
- [ ] Navigate to Settings (or Company Settings)
- [ ] **Expected:** See company information form
- [ ] Update company name: "Test Company Inc."
- [ ] Update domain: "testcompany.com"
- [ ] Click "Save"
- [ ] **Expected:** Settings updated

---

### 1️⃣1️⃣ Insights Management (Priority: MEDIUM)

#### Test 11.1: Generate Insights
- [ ] Navigate to Insights (`/insights`)
- [ ] Click "Generate Insights"
- [ ] **Expected:** See loading state
- [ ] **Expected:** New insights appear in list
- [ ] **Note:** Requires AI worker and sufficient data

#### Test 11.2: View Insights List
- [ ] **Expected:** See insights with type badges:
  - 🟢 Opportunity (green)
  - 🟡 Warning (yellow)
  - 🔵 Trend (blue)
  - 🟣 Recommendation (purple)
- [ ] **Expected:** See stats at top (Total, Unread, etc.)

#### Test 11.3: Filter Insights
- [ ] Click "Unread" filter
- [ ] **Expected:** Only unread insights shown
- [ ] Click "Opportunity" filter
- [ ] **Expected:** Only opportunity-type insights shown
- [ ] Click "All" to reset

#### Test 11.4: View Insight Detail
- [ ] Click on an insight card
- [ ] **Expected:** Navigate to `/insights/:id`
- [ ] **Expected:** See full insight details:
  - Type badge
  - Title
  - Description
  - Content
  - Key metrics
  - Recommendations
  - Related data
- [ ] **Expected:** Insight automatically marked as read

#### Test 11.5: Mark as Read/Unread
- [ ] On insights list, click "Mark as Read" on unread insight
- [ ] **Expected:** Badge changes to "Read"
- [ ] Click "Mark as Unread"
- [ ] **Expected:** Badge shows "New"

#### Test 11.6: Delete Insight
- [ ] On insight detail page, click "Delete"
- [ ] Confirm deletion
- [ ] **Expected:** Redirect to insights list
- [ ] **Expected:** Insight removed

---

## 🐛 Bug Reporting Template

If you find any issues, document them with:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Browser:**
[Chrome/Firefox/Safari/etc.]

**Console Errors:**
[Open browser DevTools > Console]
```

---

## ✅ Test Results Summary

After testing, fill this out:

### Critical Features (Must Work)
- [ ] ✅ Login/Register
- [ ] ✅ Navigation
- [ ] ✅ Create Customer
- [ ] ✅ Create Sale
- [ ] ✅ Create Campaign
- [ ] ✅ View Analytics

### Important Features (Should Work)
- [ ] ✅ Customer CRUD
- [ ] ✅ Sales CRUD
- [ ] ✅ Campaign CRUD
- [ ] ✅ All Analytics Tabs
- [ ] ✅ Chat functionality
- [ ] ✅ Conversation persistence

### Nice-to-Have Features (Can Have Issues)
- [ ] ✅ CSV Import
- [ ] ✅ Team Management
- [ ] ✅ Insights Generation
- [ ] ✅ Search/Filtering

### Performance
- [ ] ✅ Pages load quickly (<2s)
- [ ] ✅ No lag when typing
- [ ] ✅ Charts render smoothly

### User Experience
- [ ] ✅ UI looks polished
- [ ] ✅ Error messages are helpful
- [ ] ✅ Loading states are clear
- [ ] ✅ Success feedback is shown

---

## 🚨 Common Issues & Solutions

### Issue 1: "Authentication required" error
**Solution:** Clear browser localStorage and login again

### Issue 2: Charts not showing
**Solution:** Create some data first (customers, sales, campaigns)

### Issue 3: Chat not responding
**Solution:** Ensure AI worker is running on port 8000

### Issue 4: Import stuck at "Processing"
**Solution:** Check backend logs, ensure Redis is running

### Issue 5: Can't see team members
**Solution:** Login as OWNER role, check company ID is set

---

## 📊 Test Data Creation Helper

Use these curl commands to create test data quickly:

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123456"}' | jq -r '.accessToken')

# Create customer
curl -X POST http://localhost:8080/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"customer@test.com","phone":"1234567890"}'

# Create sale (replace CUSTOMER_ID)
curl -X POST http://localhost:8080/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"customerId":"CUSTOMER_ID","channel":"Website","product":"Service"}'

# Create campaign
curl -X POST http://localhost:8080/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","type":"Email","status":"active","budget":5000}'
```

---

## 🎯 Priority Testing Order

1. **Start Here:** Login/Register (Test 1)
2. **Then:** Navigation (Test 2)
3. **Then:** Dashboard Overview (Test 3)
4. **Then:** Customer Management (Test 4)
5. **Then:** Sales Management (Test 5)
6. **Then:** Campaign Management (Test 6)
7. **Then:** Analytics (Test 7)
8. **After:** Chat & Insights (Tests 8, 11)
9. **Finally:** CSV Import & Team (Tests 9, 10)

---

## 📝 Notes

- Frontend running on: http://localhost:5174
- Backend API on: http://localhost:8080
- Demo account: demo@example.com / Demo123456
- All features accessible once logged in
- Some features require data to be created first
- AI features require AI worker on port 8000

**Happy Testing! 🚀**
