import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .queue_consumer import consume_queue
from .redis_client import close_redis, get_redis

load_dotenv()

app = FastAPI(title="GrowthMonitor AI Worker")

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    try:
        redis = get_redis()
        await redis.ping()
    except Exception as error:
        raise RuntimeError("Failed to connect to Redis") from error

    stop_event = asyncio.Event()
    app.state.stop_event = stop_event
    app.state.consumer_task = asyncio.create_task(consume_queue(stop_event))


@app.on_event("shutdown")
async def shutdown_event() -> None:
    stop_event: asyncio.Event = getattr(app.state, "stop_event", None)
    consumer_task: asyncio.Task | None = getattr(app.state, "consumer_task", None)

    if stop_event:
        stop_event.set()

    if consumer_task:
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass

    await close_redis()


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.head("/healthz")
async def healthcheck_head() -> None:
    return None


@app.head("/healthz")
async def healthcheck_head() -> None:
    return None


if __name__ == "__main__":  # pragma: no cover - manual launch
    import uvicorn

    uvicorn.run(
        "ai_worker.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )
