#!/usr/bin/env python3
"""
Redis Queue Diagnostic - Check what's in the queue and verify user IDs are being passed
"""

import asyncio
import json
import redis.asyncio as redis_async
from redis import Redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL:
    print("❌ REDIS_URL not configured")
    exit(1)

# Synchronous Redis client for quick checks
redis_sync = Redis.from_url(REDIS_URL, decode_responses=True)

async def check_queue_async():
    """Check queue with async client"""
    redis = redis_async.Redis.from_url(REDIS_URL, decode_responses=True)
    
    try:
        await redis.ping()
        print("✅ Redis connection successful")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return

    # Check queue length
    queue_len = await redis.llen("ai_jobs")
    print(f"\n📊 Queue Status:")
    print(f"   Queue length: {queue_len}")

    # Peek at first job without removing it
    if queue_len > 0:
        print(f"\n📋 First Job in Queue:")
        first_job = await redis.lindex("ai_jobs", 0)
        if first_job:
            try:
                job_data = json.loads(first_job)
                print(f"   Job ID: {job_data.get('jobId')}")
                print(f"   User ID: {job_data.get('userId')}")
                print(f"   Query: {job_data.get('query')}")
                print(f"   Context Keys: {list(job_data.get('context', {}).keys())}")
                print(f"   Company ID in Context: {job_data.get('context', {}).get('companyId')}")
                print(f"   Full Job:")
                print(json.dumps(job_data, indent=2))
            except json.JSONDecodeError:
                print(f"   ❌ Could not parse job JSON")
                print(f"   Raw: {first_job[:200]}")

    # Check for any stream keys
    print(f"\n📡 Stream Keys:")
    streams = await redis.keys("ai_stream:*")
    print(f"   Active streams: {len(streams)}")
    if streams:
        for stream_key in streams[:3]:
            stream_len = await redis.llen(stream_key)
            print(f"   - {stream_key}: {stream_len} items")

    # Check for any result keys
    print(f"\n💾 Result Keys:")
    results = await redis.keys("ai_result:*")
    print(f"   Stored results: {len(results)}")
    if results:
        for result_key in results[:3]:
            result = await redis.get(result_key)
            if result:
                try:
                    result_data = json.loads(result)
                    print(f"   - {result_key}:")
                    print(f"     User ID: {result_data.get('userId')}")
                    print(f"     Content length: {len(result_data.get('content', ''))}")
                    if 'error' in result_data:
                        print(f"     Error: {result_data['error']}")
                except json.JSONDecodeError:
                    print(f"   - {result_key}: (unparseable)")

    await redis.close()

def check_queue_sync():
    """Quick synchronous check"""
    try:
        redis_sync.ping()
        print("✅ Redis sync connection successful")
    except Exception as e:
        print(f"❌ Redis sync connection failed: {e}")
        return

    print(f"\n🔍 Synchronous Queue Check:")
    queue_len = redis_sync.llen("ai_jobs")
    print(f"   Queue size: {queue_len}")
    
    # Get info about job keys
    job_owner_keys = redis_sync.keys("ai_job_owner:*")
    print(f"   Job ownership keys: {len(job_owner_keys)}")
    
    if queue_len > 0:
        # Peek without popping
        all_jobs = redis_sync.lrange("ai_jobs", 0, 10)
        print(f"\n   📋 Jobs in queue:")
        for i, job in enumerate(all_jobs, 1):
            try:
                data = json.loads(job)
                user_id = data.get('userId', 'MISSING')
                job_id = data.get('jobId', 'MISSING')[:8]
                query = data.get('query', '')[:50]
                print(f"   {i}. Job {job_id}... | User: {user_id[:8]}... | Query: {query}...")
            except:
                print(f"   {i}. [Invalid JSON]")

def check_database_access():
    """Check if database queries work with user_id"""
    print(f"\n🔌 Database Query Test:")
    
    try:
        from db import engine, fetch_sales_summary
        
        if not engine:
            print("   ❌ Database engine not initialized")
            return
        
        print("   ✅ Database engine connected")
        
        # Test with hardcoded user from seeded data
        test_user_id = "49b7d00a-ad5c-4c54-8c05-25a41fa6ab7f"
        
        try:
            result = fetch_sales_summary(test_user_id)
            if result:
                print(f"   ✅ Sales query works!")
                print(f"      Channels found: {len(result)}")
                for channel in result[:3]:
                    print(f"      - {channel['channel']}: {channel['total_amount']}")
            else:
                print(f"   ⚠️  Sales query returned no data for user {test_user_id[:8]}...")
        except Exception as e:
            print(f"   ❌ Sales query failed: {e}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

async def main():
    print("╔════════════════════════════════════════════════╗")
    print("║   REDIS QUEUE & DATABASE DIAGNOSTIC           ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    check_queue_sync()
    await check_queue_async()
    check_database_access()
    
    print(f"\n╔════════════════════════════════════════════════╗")
    print("║   DIAGNOSTIC COMPLETE                         ║")
    print("╚════════════════════════════════════════════════╝\n")

if __name__ == "__main__":
    asyncio.run(main())
