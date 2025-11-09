import asyncio
import json
import os
from typing import Any, Dict, List

from redis.exceptions import ConnectionError

from ai_pipeline import stream_ai_response
from redis_client import get_redis

RESULT_TTL_SECONDS = int(os.getenv("AI_RESULT_TTL_SECONDS", "3600"))
POLL_TIMEOUT_SECONDS = int(os.getenv("AI_QUEUE_POLL_TIMEOUT", "5"))


async def _store_final_result(redis, key: str, payload: Dict[str, Any]) -> None:
    await redis.set(key, json.dumps(payload), ex=RESULT_TTL_SECONDS)


async def consume_queue(stop_event: asyncio.Event) -> None:
    redis = get_redis()
    print("🚀 AI Worker queue consumer started - waiting for jobs...")

    while not stop_event.is_set():
        try:
            job = await redis.brpop("ai_jobs", timeout=POLL_TIMEOUT_SECONDS)
        except ConnectionError:
            print("❌ Redis connection error - retrying in 5s...")
            await asyncio.sleep(5)
            continue

        if job is None:
            continue

        _, job_payload = job

        try:
            data = json.loads(job_payload)
        except json.JSONDecodeError:
            print("⚠️  Skipping malformed job")
            # Skip malformed jobs but keep looping.
            continue

        job_id = data.get("jobId")
        if not job_id:
            print("⚠️  Job missing jobId")
            continue

        user_id = data.get("userId")
        query = data.get("query")

        if not query:
            print(f"⚠️  Job {job_id} missing query")
            continue
        context = data.get("context") or {}
        
        print(f"\n{'='*60}")
        print(f"📥 Processing job: {job_id}")
        print(f"👤 User: {user_id}")
        print(f"💬 Query: {query}")
        print(f"🔧 Context: companyId={context.get('companyId')}, userId={context.get('userId')}")
        print(f"{'='*60}\n")

        stream_key = f"ai_stream:{job_id}"
        result_key = f"ai_result:{job_id}"

        assembled_content: List[str] = []

        try:
            print(f"🤖 Generating AI response...")
            # Collect all chunks from AI
            async for chunk in stream_ai_response(query, context, user_id):
                assembled_content.append(chunk)

            full_response = "".join(assembled_content)
            print(f"✅ Generated complete response: {len(full_response)} chars")
            
            # Send the FULL response as a single message to Redis
            await redis.rpush(stream_key, json.dumps({
                "content": full_response,
                "jobId": job_id
            }))
            
            # Mark as done
            await redis.rpush(stream_key, json.dumps({"done": True}))
            
            # Store final result
            final_payload = {
                "jobId": job_id,
                "userId": user_id,
                "content": full_response,
            }
            await _store_final_result(redis, result_key, final_payload)
            await redis.expire(stream_key, RESULT_TTL_SECONDS)
            print(f"✅ Job {job_id} completed successfully\n")
        except Exception as error:  # pragma: no cover - defensive path
            print(f"❌ Error processing job {job_id}: {error}")
            error_payload = {"error": str(error), "jobId": job_id}
            await redis.rpush(stream_key, json.dumps(error_payload))
            await redis.rpush(stream_key, json.dumps({"done": True}))
            await _store_final_result(redis, result_key, error_payload)
            await redis.expire(stream_key, RESULT_TTL_SECONDS)
            print(f"⚠️  Job {job_id} completed with error\n")

    # Let the caller close Redis to keep lifecycle consistent.
