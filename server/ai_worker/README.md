# AI Worker - GrowthMonitor Intelligence Engine

Background worker for processing AI queries using LangGraph, Google Gemini, and Redis queue.

## 🎯 Overview

The AI Worker is a sophisticated business intelligence engine that handles natural language queries about sales, campaigns, and customers. It uses LangGraph to orchestrate tool selection and Google Gemini 1.5 Pro for reasoning and response generation.

### Key Features

- **18 specialized tools** for data retrieval and analysis
- **4 analysis types**: Descriptive, Diagnostic, Predictive, Prescriptive
- **Real-time streaming** responses via Redis
- **Automatic tool selection** based on query intent
- **Context-aware** insights with historical data

---

## 📊 Capabilities

### Sales Analytics
- Time-series analysis (daily/weekly/monthly)
- Product and category performance
- Regional breakdown and comparison
- Sales team rankings
- Channel effectiveness

### Campaign Analytics
- ROI and CTR calculations
- Platform performance comparison
- Budget efficiency analysis
Regional campaign effectiveness
- Conversion tracking

### Customer Analytics
- Behavioral segmentation
- Retention and churn analysis
- Customer lifetime value
- Purchase pattern recognition
- At-risk customer identification

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install -r requirements.txt

# Ensure environment variables are set
export GEMINI_API_KEY=your_key_here
export DATABASE_URL=postgresql://user:pass@localhost:5432/db
export REDIS_URL=redis://localhost:6379
```

### Start the Worker

```bash
python main.py
```

The worker will:
1. Connect to Redis
2. Connect to PostgreSQL
3. Initialize Gemini AI
4. Start consuming jobs from `ai_jobs` queue

---

## 🔧 Architecture

```
┌─────────────┐
│   API       │ → Enqueues query to Redis
└─────────────┘
       ↓
┌─────────────┐
│   Redis     │ → ai_jobs queue
└─────────────┘
       ↓
┌─────────────┐
│ AI Worker   │ → Consumes jobs
└─────────────┘
       ↓
┌─────────────┐
│ ai_pipeline │ → LangGraph Agent
└─────────────┘
       ↓
┌─────────────────────────────────┐
│  LangGraph Agent                │
│  ┌──────────────────────────┐   │
│  │ Tool Selection           │   │
│  │ - Sales Tools (7)        │   │
│  │ - Campaign Tools (3)     │   │
│  │ - Customer Tools (5)     │   │
│  │ - Context Tools (3)      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
       ↓
┌─────────────┐
│  Database   │ → PostgreSQL queries
└─────────────┘
       ↓
┌─────────────┐
│   Redis     │ → Streams response chunks
└─────────────┘
       ↓
┌─────────────┐
│   Frontend  │ → Displays results
└─────────────┘
```

---

## 📁 File Structure

```
ai_worker/
├── __init__.py           # Package init
├── main.py              # Entry point, starts worker
├── queue_consumer.py    # Redis queue consumer
├── ai_pipeline.py       # LangGraph agent and tools
├── db.py                # Database query functions (15 functions)
├── redis_client.py      # Redis connection
├── test_ai_worker.py    # Test suite
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Key Components

#### `main.py`
- Starts the queue consumer
- Handles graceful shutdown
- Manages Redis lifecycle

#### `queue_consumer.py`
- Polls `ai_jobs` queue
- Invokes AI pipeline for each job
- Streams results to `ai_stream:jobId`
- Stores final result in `ai_result:jobId`

#### `ai_pipeline.py`
- Builds LangGraph agent
- Defines 18 tools for the agent
- Manages tool execution
- Streams response chunks
- Enhanced system prompt for 4 analysis types

#### `db.py`
- 15 database query functions
- Sales queries (7)
- Campaign queries (3)
- Customer queries (4)
- Insights query (1)

---

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `GEMINI_MODEL` | Model name | `gemini-1.5-pro-latest` |
| `GEMINI_TEMPERATURE` | Response creativity | `0.2` |
| `GEMINI_MAX_OUTPUT_TOKENS` | Max response length | `2048` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `AI_RESULT_TTL_SECONDS` | Result cache duration | `3600` |
| `AI_QUEUE_POLL_TIMEOUT` | Queue poll timeout | `5` |

### Recommended Settings

**For Accuracy (Production):**
```bash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
```

**For Creativity (Exploration):**
```bash
GEMINI_TEMPERATURE=0.5
GEMINI_MAX_OUTPUT_TOKENS=4096
```

---

## 🧪 Testing

### Run All Tests
```bash
python test_ai_worker.py all
```

### Test Single Query
```bash
python test_ai_worker.py single "Show me total sales"
```

### Interactive Mode
```bash
python test_ai_worker.py interactive
```

### List Available Tests
```bash
python test_ai_worker.py list
```

---

## 📝 Example Queries

### Sales Queries
```
✅ "Show me total sales for this week"
✅ "What are my top 5 products?"
✅ "Who are my best sales reps?"
✅ "Compare Dhaka vs Chattogram sales"
✅ "Why did sales drop last week?"
✅ "Forecast next month's revenue"
✅ "What should I do to increase sales?"
```

### Campaign Queries
```
✅ "Show me all active campaigns"
✅ "What was the ROI of my Facebook campaigns?"
✅ "Which platform has best conversion rate?"
✅ "Why did the Eid campaign underperform?"
✅ "Should I increase WhatsApp ad spend?"
```

### Customer Queries
```
✅ "Show me all my customers"
✅ "Who are my top 10 customers?"
✅ "Which customers are at risk of churning?"
✅ "Which customers should I send a win-back offer to?"
```

---

## 🔍 Debugging

### Check Queue Length
```bash
redis-cli LLEN ai_jobs
```

### View Stream Content
```bash
redis-cli LRANGE "ai_stream:job-id" 0 -1
```

### Check Result
```bash
redis-cli GET "ai_result:job-id"
```

### Test Database Connection
```python
from db import fetch_sales_summary
result = fetch_sales_summary("user-id")
print(result)
```

---

## 🚨 Common Issues

### Issue: "GEMINI_API_KEY is not configured"
**Solution:** Set environment variable or add to `.env` file

### Issue: "DATABASE_URL is not configured"
**Solution:** Ensure PostgreSQL connection string is set

### Issue: No data in responses
**Solution:** 
1. Check if database has data: `SELECT COUNT(*) FROM "Sale"`
2. Verify userId in query
3. Check companyId for customer queries

### Issue: Tools not being used
**Solution:**
1. Review tool descriptions in `ai_pipeline.py`
2. Increase temperature: `GEMINI_TEMPERATURE=0.3`
3. Make query more specific

### Issue: Slow responses
**Solution:**
1. Add database indexes (see `../../AI_ENHANCEMENT_SUMMARY.md`)
2. Reduce `GEMINI_MAX_OUTPUT_TOKENS`
3. Optimize SQL queries in `db.py`

---

## 📊 Performance

### Typical Response Times
- Simple descriptive query: 2-3 seconds
- Diagnostic query: 3-5 seconds
- Predictive query: 4-6 seconds
- Prescriptive query: 5-8 seconds

### Database Query Optimization
Add these indexes for better performance:
```sql
CREATE INDEX idx_sales_user_date ON "Sale" ("userId", "date");
CREATE INDEX idx_sales_company_date ON "Sale" ("companyId", "date");
CREATE INDEX idx_campaign_user_status ON "Campaign" ("userId", "status");
CREATE INDEX idx_customer_company ON "Customer" ("companyId");
```

### Token Usage
- Average query: 500-1500 tokens
- Complex query: 1500-3000 tokens
- With tool calls: +200-500 tokens per tool

---

## 🔐 Security

### Best Practices
- Never log `GEMINI_API_KEY`
- Validate user ownership of jobs
- Use TTL for Redis keys
- Sanitize SQL parameters (using SQLAlchemy parameters)
- Limit query result sizes

### Access Control
- Jobs are user-scoped via `ai_job_owner:jobId`
- Database queries filter by `userId` or `companyId`
- Redis keys expire after `AI_RESULT_TTL_SECONDS`

---

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

### Environment Variables (Production)
```bash
GEMINI_API_KEY=<production-key>
DATABASE_URL=<production-db>
REDIS_URL=<production-redis>
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=2048
AI_RESULT_TTL_SECONDS=3600
```

### Health Check
```bash
redis-cli -u $REDIS_URL ping
psql $DATABASE_URL -c "SELECT 1"
```

---

## 📚 Additional Documentation

- **[AI_PROMPT_GUIDE.md](../../AI_PROMPT_GUIDE.md)** - Complete prompt reference
- **[AI_ENHANCEMENT_SUMMARY.md](../../AI_ENHANCEMENT_SUMMARY.md)** - Implementation details
- **[AI_QUICK_REFERENCE.md](../../AI_QUICK_REFERENCE.md)** - Quick lookup guide

---

## 🤝 Contributing

### Adding New Tools

1. **Add database query** in `db.py`:
```python
def fetch_new_metric(user_id: str) -> List[Dict]:
    query = text("SELECT ... FROM ... WHERE ...")
    with get_connection() as conn:
        result = conn.execute(query, {"user_id": user_id})
        return [dict(row._mapping) for row in result.fetchall()]
```

2. **Import in** `ai_pipeline.py`:
```python
from db import fetch_new_metric
```

3. **Add tool** in `_build_tools()`:
```python
def new_metric_tool(_: str = "") -> str:
    data = fetch_new_metric(user_id)
    return _format_output(data, "No data available.")

tools.append(
    Tool(
        name="fetch_new_metric",
        description="Description for AI agent to understand when to use this tool.",
        func=new_metric_tool,
    )
)
```

4. **Test** with `test_ai_worker.py`

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review `AI_PROMPT_GUIDE.md`
3. Test with `test_ai_worker.py`
4. Check logs and Redis queue
5. Verify database has data

---

**Version:** 2.0.0  
**Last Updated:** November 9, 2025  
**Maintainer:** GrowthMonitor Team
