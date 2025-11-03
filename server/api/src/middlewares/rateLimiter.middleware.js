import { redis } from "../services/redis.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 100);
const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW || 60);

export const rateLimiter = asyncHandler(async (req, res, next) => {
  if (!redis) {
    return next();
  }

  const key = `ratelimit:${req.ip}`;
  const pipeline = redis.multi();
  pipeline.incr(key);
  pipeline.expire(key, WINDOW_SECONDS);

  const [incrResult] = await pipeline.exec();
  const requestCount = incrResult?.[1] ?? 1;

  if (requestCount > MAX_REQUESTS) {
    res.setHeader("Retry-After", WINDOW_SECONDS.toString());
    return res
      .status(429)
      .json({ message: "Too many requests. Please slow down." });
  }

  return next();
});
