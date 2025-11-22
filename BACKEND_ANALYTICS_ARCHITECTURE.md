# 🔧 Backend Analytics & Insights Architecture

**Complete backend implementation guide for analytics and insights**

---

## 📊 **Two Separate Systems:**

### **1. Analytics (Real-time Data)**
- **Purpose:** Live database queries with caching
- **Controller:** `analytics-enhanced.controller.js`
- **Routes:** `/api/analytics/*`
- **Storage:** Direct from PostgreSQL
- **Caching:** Redis (5 minutes TTL)

### **2. Insights (AI-Generated)**
- **Purpose:** AI-analyzed business recommendations
- **Controller:** `insights.controller.js`
- **Routes:** `/api/insights/*`
- **Storage:** PostgreSQL `Insight` table
- **AI:** Gemini API for generation

---

## 📈 **Analytics System - How It Works:**

### **Architecture Flow:**
```
Frontend Request
    ↓
Express Route (/api/analytics/*)
    ↓
Controller Function
    ↓
Check Redis Cache (5 min TTL)
    ↓ (if miss)
Query PostgreSQL via Prisma
    ↓
Aggregate/Calculate Data
    ↓
Store in Redis Cache
    ↓
Return JSON Response
```

---

## 🔧 **Analytics Endpoints:**

### **1. GET /api/analytics/overview**

**Purpose:** Dashboard overview with key metrics

**Controller:** `analytics-enhanced.controller.js` → `getOverview()`

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date

**Database Queries:**
```javascript
// 1. Sales aggregation
const salesStats = await prisma.sale.aggregate({
    where: { companyId, ...dateFilter },
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true }
});

// 2. Campaign aggregation
const campaignStats = await prisma.campaign.aggregate({
    where: { companyId },
    _sum: { spend: true, impressions: true, clicks: true, conversions: true },
    _count: true
});

// 3. Customer count
const customerCount = await prisma.customer.count({
    where: { companyId }
});

// 4. Growth calculation (last 30 days vs previous 30)
const recentSales = await prisma.sale.aggregate({
    where: { companyId, date: { gte: thirtyDaysAgo } },
    _sum: { amount: true }
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1154250,
    "totalSales": 150,
    "totalCampaigns": 3,
    "totalCampaignSpend": 21000,
    "totalResponses": 450,
    "totalCustomers": 15,
    "revenueGrowth": 12.5,
    "avgSaleValue": 7695,
    "customerGrowth": 8.3
  },
  "cached": false
}
```

**Caching:**
- Key: `analytics:overview:v2:{companyId}:{startDate}:{endDate}`
- TTL: 300 seconds (5 minutes)

---

### **2. GET /api/analytics/sales-trend**

**Purpose:** Time-series sales data for charts

**Controller:** `analytics-enhanced.controller.js` → `getSalesTrend()`

**Query Parameters:**
- `startDate` (optional) - Default: 30 days ago
- `endDate` (optional) - Default: today
- `groupBy` (optional) - `day`, `week`, `month` (default: `day`)

**Database Query:**
```javascript
const sales = await prisma.sale.findMany({
    where: {
        companyId,
        date: { gte: start, lte: end }
    },
    select: { date: true, amount: true },
    orderBy: { date: 'asc' }
});

// Group by day/week/month
const grouped = {};
sales.forEach(sale => {
    const key = groupByFunction(sale.date, groupBy);
    if (!grouped[key]) {
        grouped[key] = { date: key, amount: 0, count: 0 };
    }
    grouped[key].amount += sale.amount;
    grouped[key].count += 1;
});
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "date": "2025-11-01", "amount": 45000, "count": 12 },
    { "date": "2025-11-02", "amount": 52000, "count": 15 },
    { "date": "2025-11-03", "amount": 48000, "count": 13 }
  ]
}
```

---

### **3. GET /api/analytics/channel-mix**

**Purpose:** Sales distribution by channel

**Controller:** `analytics.controller.js` → `getChannelMix()`

**Database Query:**
```javascript
const channelData = await prisma.sale.groupBy({
    by: ['channel'],
    where: { companyId, ...dateFilter },
    _sum: { amount: true },
    _count: true
});

// Calculate percentages
const totalRevenue = channelData.reduce((sum, item) => sum + item._sum.amount, 0);
const mix = channelData.map(item => ({
    channel: item.channel,
    revenue: item._sum.amount || 0,
    count: item._count,
    percentage: (item._sum.amount / totalRevenue) * 100
}));
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "channel": "WhatsApp", "revenue": 284800, "count": 65, "percentage": 24.7 },
    { "channel": "Facebook", "revenue": 221550, "count": 49, "percentage": 19.2 },
    { "channel": "In-store", "revenue": 451100, "count": 78, "percentage": 39.1 }
  ]
}
```

---

### **4. GET /api/analytics/top-customers**

**Purpose:** Top customers by spending

**Query Parameters:**
- `limit` (optional) - Default: 10
- `startDate`, `endDate` (optional)

**Database Query:**
```javascript
// 1. Group sales by customer
const customerSales = await prisma.sale.groupBy({
    by: ['customerId'],
    where: { companyId, customerId: { not: null }, ...dateFilter },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
    take: parseInt(limit)
});

// 2. Get customer details
const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true }
});

// 3. Merge data
const topCustomers = customerSales.map(item => ({
    customer: customerMap[item.customerId],
    totalPurchases: item._sum.amount,
    purchaseCount: item._count
}));
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customer": { "id": "1", "name": "John Doe", "email": "john@example.com" },
      "totalPurchases": 50000,
      "purchaseCount": 8
    }
  ]
}
```

---

### **5. GET /api/analytics/campaign-performance**

**Purpose:** Campaign metrics and ROI

**Database Query:**
```javascript
const campaigns = await prisma.campaign.findMany({
    where: { companyId },
    select: {
        id: true,
        name: true,
        platform: true,
        spend: true,
        responses: true,
        startDate: true,
        endDate: true
    },
    orderBy: { responses: 'desc' },
    take: 10
});

// Calculate metrics
const performance = campaigns.map(campaign => ({
    ...campaign,
    costPerResponse: campaign.responses > 0 
        ? campaign.spend / campaign.responses 
        : 0,
    roi: campaign.spend > 0 
        ? ((campaign.responses * 100) - campaign.spend) / campaign.spend 
        : 0
}));
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Black Friday Sale",
      "platform": "facebook",
      "spend": 7000,
      "responses": 150,
      "costPerResponse": 46.67,
      "roi": 414.29
    }
  ]
}
```

---

## 💡 **Insights System - How It Works:**

### **Architecture Flow:**
```
Frontend Request (Generate)
    ↓
POST /api/insights/generate
    ↓
Gather Analytics Data
    ↓
Call Gemini AI API
    ↓
Transform AI Response
    ↓
Store in PostgreSQL (Insight table)
    ↓
Return Created Insights
```

---

## 🔧 **Insights Endpoints:**

### **1. GET /api/insights**

**Purpose:** List all insights for user

**Controller:** `insights.controller.js` → `listInsights()`

**Database Query:**
```javascript
const insights = await prisma.insight.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
});
```

**Response:**
```json
{
  "insights": [
    {
      "id": "1",
      "userId": "user-1",
      "companyId": "company-1",
      "type": "opportunity",
      "title": "Optimize high-performing channels",
      "summary": "WhatsApp is performing 28% better than Facebook",
      "data": { "channel": "WhatsApp", "improvement": "28%" },
      "read": false,
      "createdAt": "2025-11-22T00:00:00Z"
    }
  ]
}
```

---

### **2. POST /api/insights/generate** ⚠️

**Purpose:** Generate new AI insights

**Controller:** `insights.controller.js` → `generateInsights()`

**Process:**

#### **Step 1: Gather Data**
```javascript
const [sales, campaigns, customers] = await Promise.all([
    prisma.sale.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
        take: 100,
        select: { amount: true, date: true, category: true, product: true, region: true }
    }),
    prisma.campaign.findMany({
        where: { companyId },
        select: { name: true, platform: true, status: true, spend: true, impressions: true, clicks: true, conversions: true }
    }),
    prisma.customer.findMany({
        where: { companyId },
        select: { id: true, createdAt: true, sales: { select: { amount: true } } }
    })
]);
```

#### **Step 2: Calculate Metrics**
```javascript
const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
const totalCampaignSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
const customerCount = customers.length;
```

#### **Step 3: Call Gemini AI**
```javascript
const analyticsData = {
    salesSummary: { totalRevenue, averageSale: avgSale, transactionCount: sales.length },
    campaignSummary: { totalSpend: totalCampaignSpend, totalConversions, campaignCount: campaigns.length },
    customerSummary: { totalCustomers: customerCount, newCustomersThisMonth: ... }
};

const aiInsights = await geminiService.generateBusinessInsights(analyticsData);
```

#### **Step 4: Transform & Store**
```javascript
const insightsToCreate = [];

// Add key findings
aiInsights.keyFindings.forEach(finding => {
    insightsToCreate.push({
        title: finding.title,
        summary: finding.description,
        type: 'trend',
        data: { category: 'key_finding', source: 'ai' }
    });
});

// Add opportunities
aiInsights.opportunities.forEach(opp => {
    insightsToCreate.push({
        title: opp.title,
        summary: opp.description,
        type: 'opportunity',
        data: { category: 'growth_opportunity', source: 'ai' }
    });
});

// Create in database
const created = await Promise.all(
    insightsToCreate.map(insight =>
        prisma.insight.create({
            data: { userId, companyId, ...insight }
        })
    )
);
```

#### **Step 5: Fallback (If AI Fails)**
```javascript
// If no AI insights, create system-generated ones
if (insightsToCreate.length === 0) {
    if (totalRevenue > 0) {
        insightsToCreate.push({
            title: "Revenue Performance",
            summary: `Total revenue of $${totalRevenue.toFixed(2)} from ${sales.length} transactions.`,
            type: 'trend',
            data: { revenue: totalRevenue, transactions: sales.length, source: 'system' }
        });
    }
    
    if (campaigns.length > 0) {
        const roi = totalCampaignSpend > 0 
            ? ((totalRevenue - totalCampaignSpend) / totalCampaignSpend * 100) 
            : 0;
        
        insightsToCreate.push({
            title: roi > 0 ? "Positive Campaign ROI" : "Review Campaign Strategy",
            summary: roi > 0 
                ? `Your campaigns are generating positive returns. Current ROI: ${roi.toFixed(1)}%.`
                : `Campaign spending needs optimization.`,
            type: roi > 0 ? 'opportunity' : 'warning',
            data: { campaigns: campaigns.length, roi: roi.toFixed(1), source: 'system' }
        });
    }
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 insights generated successfully",
  "insights": [...],
  "geminiEnabled": true
}
```

---

### **3. PUT /api/insights/:insightId/read**

**Purpose:** Mark insight as read

**Database Query:**
```javascript
const insight = await prisma.insight.update({
    where: { id: insightId },
    data: { read: true }
});
```

---

### **4. DELETE /api/insights/:insightId**

**Purpose:** Delete an insight

**Database Query:**
```javascript
await prisma.insight.delete({ 
    where: { id: insightId } 
});
```

---

## 🗄️ **Database Schema:**

### **Insight Table:**
```prisma
model Insight {
  id        String   @id @default(cuid())
  userId    String
  companyId String?
  type      String   // opportunity, warning, trend, recommendation
  title     String
  summary   String
  data      Json     @default("{}")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
}
```

---

## 🔄 **Caching Strategy:**

### **Redis Cache Keys:**
```
analytics:overview:v2:{companyId}:{startDate}:{endDate}
analytics:sales-trend:{companyId}:{start}:{end}:{groupBy}
analytics:channel-mix:{companyId}:{startDate}:{endDate}
analytics:top-customers:{companyId}:{limit}:{startDate}:{endDate}
analytics:campaign-performance:{companyId}
```

### **Cache TTL:**
- All analytics: **5 minutes (300 seconds)**
- Insights: **Not cached** (stored in database)

### **Cache Invalidation:**
```javascript
// Manual cache clear
DELETE /api/analytics/cache

// Automatic invalidation:
// - After 5 minutes (TTL expires)
// - On data modification (sales, campaigns, customers)
```

---

## ⚠️ **Known Issues:**

### **1. Insights Generation Returns Wrong Data**

**Problem:** When you ask "How is business going?" in chat, it returns "$0 revenue, 0 customers"

**Root Cause:** The AI chat is calling a **different insights endpoint** or using **cached/stale data**

**Location to Check:**
- AI worker tools in `ai_pipeline.py`
- Look for `fetch_recent_insights` tool
- It might be querying old insights instead of generating new ones

**Fix:**
```python
# In ai_pipeline.py, the insights tool should:
# 1. NOT use cached insights
# 2. Generate fresh insights on demand
# OR
# 3. Call the analytics endpoints directly instead of insights
```

---

### **2. Routes Mismatch**

**Issue:** `analytics.routes.js` imports from `analytics-enhanced.controller.js` but the file has different functions

**Current Routes:**
```javascript
router.get("/overview", getOverview);           // ✅ Works
router.get("/sales-trend", getSalesTrend);      // ✅ Works
router.get("/customer-insights", getCustomerInsights);  // ❌ Doesn't exist
router.get("/campaign-analytics", getCampaignAnalytics); // ❌ Doesn't exist
router.get("/ai-insights", getAIInsights);      // ❌ Doesn't exist
```

**Should Be:**
```javascript
router.get("/overview", getOverview);
router.get("/sales-trend", getSalesTrend);
router.get("/channel-mix", getChannelMix);
router.get("/top-customers", getTopCustomers);
router.get("/campaign-performance", getCampaignPerformance);
```

---

## 🎯 **For Your Interview:**

### **✅ What Works PERFECTLY:**

1. **Analytics Overview** - Real-time metrics with caching
2. **Sales Trends** - Time-series charts
3. **Channel Mix** - Distribution analysis
4. **Top Customers** - Ranked by spending
5. **Campaign Performance** - ROI calculations

### **⚠️ What Needs Explanation:**

1. **Insights Generation** - Has fallback logic if AI fails
2. **Caching Strategy** - 5-minute Redis cache for performance
3. **Growth Calculations** - 30-day vs previous 30-day comparison

### **❌ What to Skip:**

1. **AI Insights in Chat** - Returns wrong data
2. **Customer Insights endpoint** - Not implemented
3. **Campaign Analytics endpoint** - Not implemented

---

## 📝 **Demo Script:**

```
"The analytics system uses a two-tier architecture:

1. Real-time Analytics:
   - Direct PostgreSQL queries via Prisma ORM
   - Redis caching with 5-minute TTL for performance
   - Aggregation functions for metrics calculation
   - Supports date filtering and grouping

2. AI Insights:
   - Gemini AI analyzes business data
   - Generates opportunities, warnings, and recommendations
   - Stored in PostgreSQL for persistence
   - Fallback to system-generated insights if AI unavailable

The frontend calls REST endpoints, backend handles caching,
and data is visualized using Recharts library."
```

---

**This architecture provides scalable, performant analytics with intelligent caching and AI-powered insights!** 📊✨
