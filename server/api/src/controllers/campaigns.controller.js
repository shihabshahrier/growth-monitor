import { prisma } from "../services/prisma.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ campaigns });
});

export const createCampaign = asyncHandler(async (req, res) => {
  const { name, platform, startDate, endDate, responses, spend } =
    req.body ?? {};

  if (!name || !platform || !startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "name, platform, startDate, and endDate are required" });
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: req.user.id,
      name,
      platform,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      responses: typeof responses === "number" ? responses : 0,
      spend: typeof spend === "number" ? spend : 0,
    },
  });

  res.status(201).json({ campaign });
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const data = req.body ?? {};

  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      name: data.name ?? existing.name,
      platform: data.platform ?? existing.platform,
      startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
      endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
      responses:
        typeof data.responses === "number" ? data.responses : existing.responses,
      spend: typeof data.spend === "number" ? data.spend : existing.spend,
    },
  });

  res.json({ campaign: updated });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  await prisma.campaign.delete({ where: { id: campaignId } });
  res.status(204).send();
});
