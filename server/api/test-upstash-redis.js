// Test Upstash Redis Connection
import "dotenv/config";
import { redis } from "./src/services/redis.service.js";

async function testRedis() {
    console.log("🔍 Testing Upstash Redis Connection...\n");

    try {
        // Test 1: Basic ping
        console.log("1️⃣  Testing PING...");
        const pong = await redis.ping();
        console.log(`✅ PING response: ${pong}\n`);

        // Test 2: Set and get
        console.log("2️⃣  Testing SET/GET...");
        await redis.set("test_key", "Hello Upstash!");
        const value = await redis.get("test_key");
        console.log(`✅ Retrieved value: ${value}\n`);

        // Test 3: Check AI queue
        console.log("3️⃣  Checking AI job queue...");
        const queueLength = await redis.llen("ai_jobs");
        console.log(`✅ Queue length: ${queueLength} jobs pending\n`);

        // Test 4: List some keys
        console.log("4️⃣  Listing Redis keys...");
        const keys = await redis.keys("ai_*");
        console.log(`✅ Found ${keys.length} AI-related keys:`);
        if (keys.length > 0) {
            keys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
            if (keys.length > 10) console.log(`   ... and ${keys.length - 10} more`);
        }
        console.log("");

        // Cleanup
        await redis.del("test_key");

        console.log("✅ All Redis tests passed!\n");
        console.log("Redis is ready for AI chat operations.");

    } catch (error) {
        console.error("❌ Redis test failed:");
        console.error(error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

testRedis();
