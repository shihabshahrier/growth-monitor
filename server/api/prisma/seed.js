import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@growthmonitor.ai" },
    update: {},
    create: {
      name: "Demo Founder",
      email: "demo@growthmonitor.ai",
      passwordHash,
      role: "OWNER",
    },
  });

  await prisma.sale.deleteMany({ where: { userId: user.id } });
  await prisma.campaign.deleteMany({ where: { userId: user.id } });
  await prisma.insight.deleteMany({ where: { userId: user.id } });

  await prisma.sale.createMany({
    data: [
      {
        userId: user.id,
        date: new Date(),
        product: "Growth Analytics Suite",
        amount: 12500,
        channel: "Direct",
      },
      {
        userId: user.id,
        date: new Date(Date.now() - 86400000),
        product: "Growth Analytics Suite",
        amount: 8400,
        channel: "Partnership",
      },
    ],
  });

  await prisma.campaign.createMany({
    data: [
      {
        userId: user.id,
        name: "Q2 Product Launch",
        platform: "Google Ads",
        startDate: new Date(Date.now() - 7 * 86400000),
        endDate: new Date(Date.now() + 7 * 86400000),
        responses: 320,
        spend: 5400,
      },
      {
        userId: user.id,
        name: "LinkedIn Thought Leadership",
        platform: "LinkedIn",
        startDate: new Date(Date.now() - 14 * 86400000),
        endDate: new Date(Date.now() - 2 * 86400000),
        responses: 210,
        spend: 2600,
      },
    ],
  });

  await prisma.insight.create({
    data: {
      userId: user.id,
      title: "Top Channels",
      summary: "Direct sales continue to outperform, but partnerships are closing the gap.",
      data: {
        direct: 0.6,
        partnership: 0.3,
        organic: 0.1,
      },
    },
  });

  console.log("Seed completed");
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
