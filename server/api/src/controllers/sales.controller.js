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
  const {
    date,
    product,
    amount,
    channel,
    customerId,
    orderId,
    category,
    region,
    quantity,
    unitPrice,
    paymentMethod,
    salesRep,
    remarks
  } = req.body ?? {};

  if (!date || !product || !amount || !channel) {
    return res
      .status(400)
      .json({ message: "date, product, amount, and channel are required" });
  }

  const sale = await prisma.sale.create({
    data: {
      userId: req.user.id,
      companyId: req.user.companyId || null,
      customerId: customerId || null,
      date: new Date(date),
      product,
      amount,
      channel,
      orderId: orderId || null,
      category: category || null,
      region: region || null,
      quantity: quantity ? parseInt(quantity) : null,
      unitPrice: unitPrice ? parseFloat(unitPrice) : null,
      paymentMethod: paymentMethod || null,
      salesRep: salesRep || null,
      remarks: remarks || null,
    },
  });

  res.status(201).json({ sale });
});

export const updateSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const {
    date,
    product,
    amount,
    channel,
    customerId,
    orderId,
    category,
    region,
    quantity,
    unitPrice,
    paymentMethod,
    salesRep,
    remarks
  } = req.body ?? {};

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
      customerId: customerId !== undefined ? customerId : existing.customerId,
      orderId: orderId !== undefined ? orderId : existing.orderId,
      category: category !== undefined ? category : existing.category,
      region: region !== undefined ? region : existing.region,
      quantity: quantity !== undefined ? parseInt(quantity) : existing.quantity,
      unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existing.unitPrice,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
      salesRep: salesRep !== undefined ? salesRep : existing.salesRep,
      remarks: remarks !== undefined ? remarks : existing.remarks,
    },
  });

  res.json({ sale: updated });
});

export const getSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      OR: [
        { userId: req.user.id },
        { companyId: req.user.companyId },
      ],
    },
    include: {
      customer: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!sale) {
    return res.status(404).json({ message: "Sale not found" });
  }

  res.json({ sale });
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
