import { prisma } from "../services/prisma.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ campaigns });
});

export const getCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: req.user.id },
  });

  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  res.json({ campaign });
});

export const createCampaign = asyncHandler(async (req, res) => {
  const {
    name,
    platform,
    startDate,
    endDate,
    responses,
    spend,
    region,
    impressions,
    clicks,
    conversions,
    revenueGenerated,
    salesRep,
    status,
    remarks
  } = req.body ?? {};

  if (!name || !platform || !startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "name, platform, startDate, and endDate are required" });
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: req.user.id,
      companyId: req.user.companyId || null,
      name,
      platform,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      responses: typeof responses === "number" ? responses : 0,
      spend: typeof spend === "number" ? spend : 0,
      region: region || null,
      impressions: impressions ? parseInt(impressions) : null,
      clicks: clicks ? parseInt(clicks) : null,
      conversions: conversions ? parseInt(conversions) : null,
      revenueGenerated: revenueGenerated ? parseFloat(revenueGenerated) : null,
      salesRep: salesRep || null,
      status: status || "Active",
      remarks: remarks || null,
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
      responses: typeof data.responses === "number" ? data.responses : existing.responses,
      spend: typeof data.spend === "number" ? data.spend : existing.spend,
      region: data.region !== undefined ? data.region : existing.region,
      impressions: data.impressions !== undefined ? parseInt(data.impressions) : existing.impressions,
      clicks: data.clicks !== undefined ? parseInt(data.clicks) : existing.clicks,
      conversions: data.conversions !== undefined ? parseInt(data.conversions) : existing.conversions,
      revenueGenerated: data.revenueGenerated !== undefined ? parseFloat(data.revenueGenerated) : existing.revenueGenerated,
      salesRep: data.salesRep !== undefined ? data.salesRep : existing.salesRep,
      status: data.status !== undefined ? data.status : existing.status,
      remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
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
