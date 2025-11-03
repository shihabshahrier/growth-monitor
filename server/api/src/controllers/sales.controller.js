import { prisma } from "../services/prisma.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listSales = asyncHandler(async (req, res) => {
  const sales = await prisma.sale.findMany({
    where: { userId: req.user.id },
    orderBy: { date: "desc" },
  });

  res.json({ sales });
});

export const createSale = asyncHandler(async (req, res) => {
  const { date, product, amount, channel } = req.body ?? {};
  if (!date || !product || typeof amount !== "number" || !channel) {
    return res
      .status(400)
      .json({ message: "date, product, amount, and channel are required" });
  }

  const sale = await prisma.sale.create({
    data: {
      userId: req.user.id,
      date: new Date(date),
      product,
      amount,
      channel,
    },
  });

  res.status(201).json({ sale });
});

export const updateSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const { date, product, amount, channel } = req.body ?? {};

  const existing = await prisma.sale.findFirst({
    where: { id: saleId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Sale not found" });
  }

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: {
      date: date ? new Date(date) : existing.date,
      product: product ?? existing.product,
      amount: typeof amount === "number" ? amount : existing.amount,
      channel: channel ?? existing.channel,
    },
  });

  res.json({ sale: updated });
});

export const deleteSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  const existing = await prisma.sale.findFirst({
    where: { id: saleId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Sale not found" });
  }

  await prisma.sale.delete({ where: { id: saleId } });
  res.status(204).send();
});
