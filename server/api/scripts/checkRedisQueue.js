#!/usr/bin/env node
import "dotenv/config";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function main() {
    console.log("Checking Redis queue...\n");

    // Check queue length
    const queueLength = await redis.llen("ai_jobs");
    console.log(`✅ Queue length (ai_jobs): ${queueLength}`);

    // List all keys matching ai_*
    const keys = await redis.keys("ai_*");
    console.log(`\n✅ Found ${keys.length} AI-related keys:`);
    for (const key of keys.slice(0, 10)) {
        const type = await redis.type(key);
        console.log(`   - ${key} (${type})`);
    }

    // Check if there are any job owner keys
    const jobOwnerKeys = await redis.keys("ai_job_owner:*");
    console.log(`\n✅ Active job owner keys: ${jobOwnerKeys.length}`);

    await redis.quit();
}

main().catch(console.error);
