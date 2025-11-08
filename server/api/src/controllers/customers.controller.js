import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";

/**
 * Create a new customer
 * POST /api/customers
 */
export const createCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone, metadata } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company to create customers"
        });
    }

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Customer name is required"
        });
    }

    const customer = await prisma.customer.create({
        data: {
            companyId,
            name,
            email: email || null,
            phone: phone || null,
            metadata: metadata || null
        }
    });

    res.status(201).json({
        success: true,
        data: customer
    });
});

/**
 * Get all customers (with pagination and search)
 * GET /api/customers
 */
export const getCustomers = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10, search = '' } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
        companyId,
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        })
    };

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        }),
        prisma.customer.count({ where })
    ]);

    res.json({
        success: true,
        data: customers,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / take)
        }
    });
});

/**
 * Get a single customer by ID
 * GET /api/customers/:id
 */
export const getCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const customer = await prisma.customer.findFirst({
        where: { id, companyId },
        include: {
            sales: {
                orderBy: { date: 'desc' },
                take: 10
            },
            _count: {
                select: { sales: true }
            }
        }
    });

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }

    // Calculate total purchase amount
    const totalPurchases = await prisma.sale.aggregate({
        where: { customerId: id, companyId },
        _sum: { amount: true }
    });

    res.json({
        success: true,
        data: {
            ...customer,
            totalPurchases: totalPurchases._sum.amount || 0
        }
    });
});

/**
 * Update a customer
 * PUT /api/customers/:id
 */
export const updateCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, metadata } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Check if customer exists and belongs to company
    const existingCustomer = await prisma.customer.findFirst({
        where: { id, companyId }
    });

    if (!existingCustomer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }

    const customer = await prisma.customer.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(email !== undefined && { email: email || null }),
            ...(phone !== undefined && { phone: phone || null }),
            ...(metadata !== undefined && { metadata })
        }
    });

    res.json({
        success: true,
        data: customer
    });
});

/**
 * Delete a customer
 * DELETE /api/customers/:id
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Check if customer exists and belongs to company
    const customer = await prisma.customer.findFirst({
        where: { id, companyId }
    });

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }

    // Delete customer (sales will have customerId set to null due to SetNull)
    await prisma.customer.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: "Customer deleted successfully"
    });
});
