const redis = require('./src/services/redis.service.js').redis;

async function test() {
    try {
        if (!redis) {
            console.log('❌ Redis not configured');
            return;
        }

        console.log('Testing Redis...');
        await redis.ping();
        console.log('✅ Redis connected');

        // Check queue
        const queueLength = await redis.llen('ai_jobs');
        console.log('AI jobs queue length:', queueLength);

        // Check if there are any stuck jobs
        if (queueLength > 0) {
            console.log('⚠️  There are', queueLength, 'jobs in queue');
            const job = await redis.lindex('ai_jobs', 0);
            console.log('First job:', job ? JSON.parse(job) : 'none');
        }

    } catch (error) {
        console.error('❌ Redis error:', error.message);
    }
    process.exit(0);
}

test();
