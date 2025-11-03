import os
from typing import Optional

from redis.asyncio import Redis

_redis_instance: Optional[Redis] = None


def get_redis() -> Redis:
    global _redis_instance
    if _redis_instance is None:
        url = os.getenv("REDIS_URL")
        if not url:
            raise RuntimeError("REDIS_URL is not set for AI worker")
        _redis_instance = Redis.from_url(url, decode_responses=True)
    return _redis_instance


async def close_redis() -> None:
    global _redis_instance
    if _redis_instance is not None:
        await _redis_instance.close()
        if hasattr(_redis_instance, "wait_closed"):
            await _redis_instance.wait_closed()
        _redis_instance = None
