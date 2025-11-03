import { prisma } from "../services/prisma.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listInsights = asyncHandler(async (req, res) => {
  const insights = await prisma.insight.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ insights });
});

export const createInsight = asyncHandler(async (req, res) => {
  const { title, summary, data } = req.body ?? {};

  if (!title || !summary) {
    return res.status(400).json({ message: "title and summary are required" });
  }

  const insight = await prisma.insight.create({
    data: {
      userId: req.user.id,
      title,
      summary,
      data: data ?? {},
    },
  });

  res.status(201).json({ insight });
});

export const deleteInsight = asyncHandler(async (req, res) => {
  const { insightId } = req.params;

  const existing = await prisma.insight.findFirst({
    where: { id: insightId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Insight not found" });
  }

  await prisma.insight.delete({ where: { id: insightId } });
  res.status(204).send();
});
