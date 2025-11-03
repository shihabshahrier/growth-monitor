import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const initPrisma = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("Failed to connect to Prisma", error);
    throw error;
  }
};

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to disconnect Prisma", error);
  }
};
