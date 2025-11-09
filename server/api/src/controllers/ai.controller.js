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

  // Enrich context with user's companyId for customer queries
  const enrichedContext = {
    ...context,
    companyId: req.user.companyId,
    userId: req.user.id,
  };

  const payload = {
    jobId,
    userId: req.user.id,
    query,
    context: enrichedContext,
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

  let isDone = false;

  const interval = setInterval(async () => {
    if (isDone) return;

    // Pop message from Redis
    const message = await redis.lpop(`ai_stream:${jobId}`);
    if (!message) return;

    try {
      const parsed = JSON.parse(message);

      if (parsed.done) {
        isDone = true;
        clearInterval(interval);
        res.write(`data: ${message}\n\n`);
        res.end();
        console.log(`✅ Finished streaming job ${jobId}`);
        return;
      }

      if (parsed.content) {
        console.log(`� Sending full response (${parsed.content.length} chars) to frontend`);
        // Send the whole thing at once
        res.write(`data: ${message}\n\n`);
      }
    } catch (error) {
      console.error(`❌ Error parsing message for job ${jobId}:`, error);
    }
  }, 20);

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
