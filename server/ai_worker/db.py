import os
from contextlib import contextmanager
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables FIRST
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    print(f"✅ DATABASE_URL loaded: {DATABASE_URL[:30]}...")
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    print(f"✅ Database engine created successfully")
else:
    print("❌ DATABASE_URL not found in environment!")
    engine = None


@contextmanager
def get_connection():
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured for AI worker")
    connection = engine.connect()
    try:
        yield connection
    finally:
        connection.close()


# ============================================================================
# SALES-RELATED QUERIES
# ============================================================================

def fetch_sales_summary(user_id: str, company_id: str | None = None) -> List[Dict[str, float]]:
    """Get aggregated sales by channel."""
    if engine is None:
        return []

    # Query by companyId if available (to see all company sales), otherwise by userId
    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT "channel" AS channel, SUM("amount") AS total_amount
        FROM "Sale"
        WHERE {where_clause}
        GROUP BY "channel"
        ORDER BY total_amount DESC
        LIMIT 10
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_sales_by_time_period(
    user_id: str, 
    company_id: str | None = None,
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    group_by: str = "day"
) -> List[Dict]:
    """Get sales data for a specific time period, grouped by day/week/month."""
    if engine is None:
        return []

    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    # Choose date truncation based on group_by
    date_trunc_map = {
        "day": "day",
        "week": "week",
        "month": "month",
        "year": "year"
    }
    trunc = date_trunc_map.get(group_by, "day")

    # Query by companyId if available, otherwise by userId
    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "trunc": trunc
    }
    if company_id:
        params["company_id"] = company_id
    else:
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT 
            DATE_TRUNC(:trunc, "date") AS period,
            COUNT(*) AS total_orders,
            SUM("amount") AS total_revenue,
            AVG("amount") AS avg_order_value,
            SUM("quantity") AS total_quantity
        FROM "Sale"
        WHERE {where_clause}
            AND "date" >= :start_date::date
            AND "date" <= :end_date::date
        GROUP BY period
        ORDER BY period DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_top_products(user_id: str, company_id: str | None = None, limit: int = 10) -> List[Dict]:
    """Get top-selling products by revenue."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"limit": limit}
    if company_id:
        params["company_id"] = company_id
    else:
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT 
            "product",
            "category",
            COUNT(*) AS order_count,
            SUM("quantity") AS total_quantity,
            SUM("amount") AS total_revenue,
            AVG("amount") AS avg_price
        FROM "Sale"
        WHERE {where_clause}
        GROUP BY "product", "category"
        ORDER BY total_revenue DESC
        LIMIT :limit
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_sales_by_region(user_id: str, company_id: str | None = None) -> List[Dict]:
    """Get sales breakdown by region."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT 
            "region",
            COUNT(*) AS order_count,
            SUM("amount") AS total_revenue,
            AVG("amount") AS avg_order_value
        FROM "Sale"
        WHERE {where_clause} AND "region" IS NOT NULL
        GROUP BY "region"
        ORDER BY total_revenue DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_top_sales_reps(user_id: str, company_id: str | None = None, limit: int = 10) -> List[Dict]:
    """Get top-performing sales representatives."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"limit": limit}
    if company_id:
        params["company_id"] = company_id
    else:
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT 
            "salesRep",
            COUNT(*) AS total_sales,
            SUM("amount") AS total_revenue,
            AVG("amount") AS avg_sale_value
        FROM "Sale"
        WHERE {where_clause} AND "salesRep" IS NOT NULL
        GROUP BY "salesRep"
        ORDER BY total_revenue DESC
        LIMIT :limit
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_sales_by_category(user_id: str, company_id: str | None = None) -> List[Dict]:
    """Get sales breakdown by product category."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT 
            "category",
            COUNT(*) AS order_count,
            SUM("amount") AS total_revenue,
            SUM("quantity") AS total_quantity,
            AVG("amount") AS avg_order_value
        FROM "Sale"
        WHERE {where_clause} AND "category" IS NOT NULL
        GROUP BY "category"
        ORDER BY total_revenue DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_sales_by_channel(user_id: str, company_id: str | None = None) -> List[Dict]:
    """Get sales breakdown by channel with detailed metrics."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT 
            "channel",
            COUNT(*) AS order_count,
            SUM("amount") AS total_revenue,
            AVG("amount") AS avg_order_value,
            SUM("quantity") AS total_quantity
        FROM "Sale"
        WHERE {where_clause}
        GROUP BY "channel"
        ORDER BY total_revenue DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


# ============================================================================
# CAMPAIGN-RELATED QUERIES
# ============================================================================

def fetch_campaigns_summary(user_id: str, company_id: str | None = None, status: Optional[str] = None) -> List[Dict]:
    """Get campaigns with performance metrics."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {}
    if company_id:
        params["company_id"] = company_id
    else:
        params["user_id"] = user_id
    
    if status:
        where_clause += ' AND "status" = :status'
        params["status"] = status

    query = text(
        f"""
        SELECT 
            "id",
            "name",
            "platform",
            "region",
            "status",
            "startDate",
            "endDate",
            "spend",
            "impressions",
            "clicks",
            "responses",
            "conversions",
            "revenueGenerated",
            CASE 
                WHEN "spend" > 0 THEN ("revenueGenerated" / "spend")
                ELSE 0 
            END AS roi,
            CASE 
                WHEN "impressions" > 0 THEN (CAST("clicks" AS FLOAT) / "impressions" * 100)
                ELSE 0 
            END AS ctr,
            CASE 
                WHEN "responses" > 0 THEN ("spend" / "responses")
                ELSE 0 
            END AS cost_per_lead,
            "createdAt"
        FROM "Campaign"
        WHERE {where_clause}
        ORDER BY "createdAt" DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_campaign_performance_by_platform(user_id: str, company_id: str | None = None) -> List[Dict]:
    """Get aggregated campaign performance by platform."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT 
            "platform",
            COUNT(*) AS campaign_count,
            SUM("spend") AS total_spend,
            SUM("impressions") AS total_impressions,
            SUM("clicks") AS total_clicks,
            SUM("responses") AS total_leads,
            SUM("conversions") AS total_conversions,
            SUM("revenueGenerated") AS total_revenue,
            CASE 
                WHEN SUM("spend") > 0 THEN (SUM("revenueGenerated") / SUM("spend"))
                ELSE 0 
            END AS avg_roi,
            CASE 
                WHEN SUM("impressions") > 0 THEN (CAST(SUM("clicks") AS FLOAT) / SUM("impressions") * 100)
                ELSE 0 
            END AS avg_ctr
        FROM "Campaign"
        WHERE {where_clause}
        GROUP BY "platform"
        ORDER BY total_revenue DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_campaign_performance_by_region(user_id: str, company_id: str | None = None) -> List[Dict]:
    """Get campaign performance by region."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"company_id": company_id} if company_id else {"user_id": user_id}

    query = text(
        f"""
        SELECT 
            "region",
            COUNT(*) AS campaign_count,
            SUM("spend") AS total_spend,
            SUM("responses") AS total_leads,
            SUM("conversions") AS total_conversions,
            SUM("revenueGenerated") AS total_revenue,
            CASE 
                WHEN SUM("spend") > 0 THEN (SUM("revenueGenerated") / SUM("spend"))
                ELSE 0 
            END AS roi
        FROM "Campaign"
        WHERE {where_clause} AND "region" IS NOT NULL
        GROUP BY "region"
        ORDER BY total_revenue DESC
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]


# ============================================================================
# CUSTOMER-RELATED QUERIES
# ============================================================================

def fetch_customer_summary(company_id: str) -> List[Dict]:
    """Get customer summary with purchase behavior."""
    if engine is None:
        return []

    query = text(
        """
        SELECT 
            c."id",
            c."name",
            c."email",
            c."phone",
            COUNT(s."id") AS total_orders,
            SUM(s."amount") AS total_spent,
            AVG(s."amount") AS avg_order_value,
            MAX(s."date") AS last_purchase_date,
            MIN(s."date") AS first_purchase_date
        FROM "Customer" c
        LEFT JOIN "Sale" s ON c."id" = s."customerId"
        WHERE c."companyId" = :company_id
        GROUP BY c."id", c."name", c."email", c."phone"
        ORDER BY total_spent DESC NULLS LAST
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"company_id": company_id})
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_customer_segments(company_id: str) -> List[Dict]:
    """Segment customers by purchase frequency and value."""
    if engine is None:
        return []

    query = text(
        """
        WITH customer_stats AS (
            SELECT 
                c."id",
                c."name",
                COUNT(s."id") AS order_count,
                SUM(s."amount") AS total_spent,
                MAX(s."date") AS last_purchase,
                EXTRACT(DAY FROM NOW() - MAX(s."date")) AS days_since_purchase
            FROM "Customer" c
            LEFT JOIN "Sale" s ON c."id" = s."customerId"
            WHERE c."companyId" = :company_id
            GROUP BY c."id", c."name"
        )
        SELECT 
            "id",
            "name",
            order_count,
            total_spent,
            last_purchase,
            days_since_purchase,
            CASE 
                WHEN order_count = 0 THEN 'No Purchase'
                WHEN order_count = 1 THEN 'One-time Buyer'
                WHEN order_count >= 2 AND order_count <= 4 THEN 'Occasional Buyer'
                WHEN order_count >= 5 THEN 'Loyal Customer'
            END AS segment,
            CASE 
                WHEN days_since_purchase > 90 THEN 'At Risk'
                WHEN days_since_purchase > 60 THEN 'Needs Attention'
                WHEN days_since_purchase <= 60 THEN 'Active'
                ELSE 'Unknown'
            END AS status
        FROM customer_stats
        ORDER BY total_spent DESC NULLS LAST
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"company_id": company_id})
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_customer_retention_metrics(company_id: str) -> List[Dict]:
    """Calculate customer retention and churn metrics."""
    if engine is None:
        return []

    query = text(
        """
        WITH monthly_customers AS (
            SELECT 
                DATE_TRUNC('month', s."date") AS month,
                COUNT(DISTINCT s."customerId") AS active_customers,
                COUNT(DISTINCT CASE WHEN s2."customerId" IS NOT NULL THEN s."customerId" END) AS returning_customers
            FROM "Sale" s
            LEFT JOIN "Sale" s2 ON s."customerId" = s2."customerId" 
                AND DATE_TRUNC('month', s2."date") < DATE_TRUNC('month', s."date")
            WHERE EXISTS (
                SELECT 1 FROM "Customer" c 
                WHERE c."id" = s."customerId" 
                AND c."companyId" = :company_id
            )
            GROUP BY month
        )
        SELECT 
            month,
            active_customers,
            returning_customers,
            active_customers - returning_customers AS new_customers,
            CASE 
                WHEN active_customers > 0 THEN 
                    ROUND((CAST(returning_customers AS FLOAT) / active_customers * 100), 2)
                ELSE 0 
            END AS retention_rate
        FROM monthly_customers
        ORDER BY month DESC
        LIMIT 12
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"company_id": company_id})
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_top_customers(company_id: str, limit: int = 10) -> List[Dict]:
    """Get top customers by total spending."""
    if engine is None:
        return []

    query = text(
        """
        SELECT 
            c."id",
            c."name",
            c."email",
            COUNT(s."id") AS total_orders,
            SUM(s."amount") AS total_spent,
            MAX(s."date") AS last_purchase
        FROM "Customer" c
        INNER JOIN "Sale" s ON c."id" = s."customerId"
        WHERE c."companyId" = :company_id
        GROUP BY c."id", c."name", c."email"
        ORDER BY total_spent DESC
        LIMIT :limit
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"company_id": company_id, "limit": limit})
        return [dict(row._mapping) for row in result.fetchall()]


# ============================================================================
# INSIGHTS
# ============================================================================

def fetch_recent_insights(user_id: str, company_id: str | None = None, limit: int = 5) -> List[Dict]:
    """Get recent insights for the user."""
    if engine is None:
        return []

    where_clause = '"companyId" = :company_id' if company_id else '"userId" = :user_id'
    params = {"limit": limit}
    if company_id:
        params["company_id"] = company_id
    else:
        params["user_id"] = user_id

    query = text(
        f"""
        SELECT "title", "summary", "type", "data", "createdAt"
        FROM "Insight"
        WHERE {where_clause}
        ORDER BY "createdAt" DESC
        LIMIT :limit
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, params)
        return [dict(row._mapping) for row in result.fetchall()]
