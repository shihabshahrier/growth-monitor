import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true })
  : null;

export const initRedis = async () => {
  if (!redis) {
    console.warn("Redis URL not provided. Queue features will be disabled.");
    return;
  }

  if (redis.status === "ready") {
    return;
  }

  try {
    await redis.connect();
  } catch (error) {
    console.error("Failed to connect to Redis", error);
    throw error;
  }
};

if (redis) {
  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });
}

export const disconnectRedis = async () => {
  if (!redis) {
    return;
  }

  try {
    await redis.quit();
  } catch (error) {
    console.error("Failed to close Redis connection", error);
  }
};
