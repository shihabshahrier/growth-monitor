import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";
import { redis } from "../services/redis.service.js";

/**
 * Get dashboard overview statistics
 * GET /api/analytics/overview
 */
export const getOverview = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Try to get from cache
    const cacheKey = `analytics:overview:${companyId}:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
        });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get total sales
    const salesStats = await prisma.sale.aggregate({
        where: { companyId, ...dateFilter },
        _sum: { amount: true },
        _count: true
    });

    // Get total campaigns
    const campaignStats = await prisma.campaign.aggregate({
        where: { companyId },
        _sum: { spend: true, responses: true },
        _count: true
    });

    // Get customer count
    const customerCount = await prisma.customer.count({
        where: { companyId }
    });

    // Calculate growth rates (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentSales, previousSales] = await Promise.all([
        prisma.sale.aggregate({
            where: {
                companyId,
                date: { gte: thirtyDaysAgo }
            },
            _sum: { amount: true }
        }),
        prisma.sale.aggregate({
            where: {
                companyId,
                date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
            },
            _sum: { amount: true }
        })
    ]);

    const recentAmount = recentSales._sum.amount || 0;
    const previousAmount = previousSales._sum.amount || 0;
    const growthRate = previousAmount > 0
        ? ((recentAmount - previousAmount) / previousAmount) * 100
        : 0;

    const overview = {
        totalRevenue: salesStats._sum.amount || 0,
        totalSales: salesStats._count,
        totalCampaigns: campaignStats._count,
        totalCampaignSpend: campaignStats._sum.spend || 0,
        totalResponses: campaignStats._sum.responses || 0,
        totalCustomers: customerCount,
        revenueGrowth: growthRate,
        avgSaleValue: salesStats._count > 0
            ? (salesStats._sum.amount || 0) / salesStats._count
            : 0
    };

  // Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(overview), 'EX', 300);

  res.json({
    success: true,
    data: overview
  });
});/**
 * Get sales trend over time
 * GET /api/analytics/sales-trend
 */
export const getSalesTrend = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
        start.setDate(start.getDate() - 30);
    }

    const cacheKey = `analytics:sales-trend:${companyId}:${start.toISOString()}:${end.toISOString()}:${groupBy}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
        });
    }

    // Get sales grouped by date
    const sales = await prisma.sale.findMany({
        where: {
            companyId,
            date: {
                gte: start,
                lte: end
            }
        },
        select: {
            date: true,
            amount: true
        },
        orderBy: { date: 'asc' }
    });

    // Group by day/week/month
    const grouped = {};
    sales.forEach(sale => {
        let key;
        const date = new Date(sale.date);

        if (groupBy === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
            grouped[key] = { date: key, amount: 0, count: 0 };
        }
        grouped[key].amount += sale.amount;
        grouped[key].count += 1;
    });

    const trend = Object.values(grouped).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  await redis.set(cacheKey, JSON.stringify(trend), 'EX', 300);

  res.json({
    success: true,
    data: trend
  });
});/**
 * Get sales by channel distribution
 * GET /api/analytics/channel-mix
 */
export const getChannelMix = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:channel-mix:${companyId}:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
        });
    }

    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const channelData = await prisma.sale.groupBy({
        by: ['channel'],
        where: { companyId, ...dateFilter },
        _sum: { amount: true },
        _count: true
    });

    const mix = channelData.map(item => ({
        channel: item.channel,
        revenue: item._sum.amount || 0,
        count: item._count,
        percentage: 0 // Will calculate after getting total
    }));

    const totalRevenue = mix.reduce((sum, item) => sum + item.revenue, 0);
    mix.forEach(item => {
        item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
    });

  await redis.set(cacheKey, JSON.stringify(mix), 'EX', 300);

  res.json({
    success: true,
    data: mix
  });
});/**
 * Get top customers by purchase amount
 * GET /api/analytics/top-customers
 */
export const getTopCustomers = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { limit = 10, startDate, endDate } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:top-customers:${companyId}:${limit}:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
        });
    }

    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get sales grouped by customer
    const customerSales = await prisma.sale.groupBy({
        by: ['customerId'],
        where: {
            companyId,
            customerId: { not: null },
            ...dateFilter
        },
        _sum: { amount: true },
        _count: true,
        orderBy: {
            _sum: {
                amount: 'desc'
            }
        },
        take: parseInt(limit)
    });

    // Get customer details
    const customerIds = customerSales
        .map(item => item.customerId)
        .filter(id => id !== null);

    const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, email: true }
    });

    const customerMap = customers.reduce((map, customer) => {
        map[customer.id] = customer;
        return map;
    }, {});

    const topCustomers = customerSales.map(item => ({
        customer: customerMap[item.customerId] || null,
        totalPurchases: item._sum.amount || 0,
        purchaseCount: item._count
    }));

  await redis.set(cacheKey, JSON.stringify(topCustomers), 'EX', 300);

  res.json({
    success: true,
    data: topCustomers
  });
});/**
 * Get campaign performance metrics
 * GET /api/analytics/campaign-performance
 */
export const getCampaignPerformance = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:campaign-performance:${companyId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
        });
    }

    const campaigns = await prisma.campaign.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            platform: true,
            spend: true,
            responses: true,
            startDate: true,
            endDate: true
        },
        orderBy: { responses: 'desc' },
        take: 10
    });

    const performance = campaigns.map(campaign => ({
        ...campaign,
        costPerResponse: campaign.responses > 0 ? campaign.spend / campaign.responses : 0,
        roi: campaign.spend > 0 ? ((campaign.responses * 100) - campaign.spend) / campaign.spend : 0
    }));

  await redis.set(cacheKey, JSON.stringify(performance), 'EX', 300);

  res.json({
    success: true,
    data: performance
  });
});