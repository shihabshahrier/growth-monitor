import { v4 as uuidv4 } from "uuid";
import { redis } from "../services/redis.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const JOB_OWNER_TTL_SECONDS = Number(process.env.AI_JOB_TTL_SECONDS || 3600);

export const enqueueQuery = asyncHandler(async (req, res) => {
  if (!redis) {
    return res.status(503).json({ message: "AI queue unavailable" });
  }

  const { query, context = {} } = req.body ?? {};

  if (!query) {
    return res.status(400).json({ message: "query is required" });
  }

  const jobId = uuidv4();
  const payload = {
    jobId,
    userId: req.user.id,
    query,
    context,
    createdAt: new Date().toISOString(),
  };

  await redis.lpush("ai_jobs", JSON.stringify(payload));
  await redis.del(`ai_stream:${jobId}`);
  await redis.del(`ai_result:${jobId}`);
  await redis.set(
    `ai_job_owner:${jobId}`,
    req.user.id,
    "EX",
    JOB_OWNER_TTL_SECONDS,
  );

  res.status(202).json({ jobId });
});

export const streamResult = asyncHandler(async (req, res) => {
  if (!redis) {
    return res.status(503).json({ message: "AI stream unavailable" });
  }

  const { jobId } = req.params;
  const ownerId = await redis.get(`ai_job_owner:${jobId}`);
  if (ownerId && ownerId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized for this job" });
  }

  if (!ownerId) {
    return res.status(404).json({ message: "Job not found or expired" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(async () => {
    const chunk = await redis.lpop(`ai_stream:${jobId}`);
    if (!chunk) {
      return;
    }

    res.write(`data: ${chunk}\n\n`);

    try {
      const parsed = JSON.parse(chunk);
      if (parsed.done) {
        clearInterval(interval);
        res.end();
      }
    } catch (error) {
      // Ignore malformed chunk and continue streaming.
    }
  }, 500);

  const cleanUp = () => {
    clearInterval(interval);
  };

  req.on("close", cleanUp);
});

export const getResult = asyncHandler(async (req, res) => {
  if (!redis) {
    return res.status(503).json({ message: "AI storage unavailable" });
  }

  const { jobId } = req.params;
  const ownerId = await redis.get(`ai_job_owner:${jobId}`);
  if (ownerId && ownerId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized for this job" });
  }

  if (!ownerId) {
    return res.status(404).json({ message: "Job not found or expired" });
  }

  const result = await redis.get(`ai_result:${jobId}`);

  if (!result) {
    return res.status(404).json({ message: "Result not ready" });
  }

  res.json(JSON.parse(result));
});
