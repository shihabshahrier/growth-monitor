import os
from contextlib import contextmanager
from typing import Dict, List

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


@contextmanager
def get_connection():
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured for AI worker")
    connection = engine.connect()
    try:
        yield connection
    finally:
        connection.close()


def fetch_sales_summary(user_id: str) -> List[Dict[str, float]]:
    if engine is None:
        return []

    query = text(
        """
        SELECT "channel" AS channel, SUM("amount") AS total_amount
        FROM "Sale"
        WHERE "userId" = :user_id
        GROUP BY "channel"
        ORDER BY total_amount DESC
        LIMIT 10
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"user_id": user_id})
        return [dict(row._mapping) for row in result.fetchall()]


def fetch_recent_insights(user_id: str, limit: int = 5) -> List[Dict]:
    if engine is None:
        return []

    query = text(
        """
        SELECT "title", "summary", "data", "createdAt"
        FROM "Insight"
        WHERE "userId" = :user_id
        ORDER BY "createdAt" DESC
        LIMIT :limit
        """
    )

    with get_connection() as conn:
        result = conn.execute(query, {"user_id": user_id, "limit": limit})
        return [dict(row._mapping) for row in result.fetchall()]
