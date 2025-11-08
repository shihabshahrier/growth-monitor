import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";
import { redis } from "../services/redis.service.js";
import { geminiService } from "../services/gemini.service.js";

// Helper functions for Redis cache with error handling
const getCachedData = async (key) => {
    try {
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('Redis cache read failed:', error.message);
    }
    return null;
};

const setCachedData = async (key, data, ttl = 300) => {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
        console.warn('Redis cache write failed:', error.message);
    }
};

/**
 * Get comprehensive dashboard overview with all key metrics
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

    const cacheKey = `analytics:overview:v2:${companyId}:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached,
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

    // Get sales stats
    const salesStats = await prisma.sale.aggregate({
        where: { companyId, ...dateFilter },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true }
    });

    // Get campaign stats
    const campaignStats = await prisma.campaign.aggregate({
        where: { companyId },
        _sum: {
            spend: true,
            impressions: true,
            clicks: true,
            conversions: true
        },
        _count: true
    });

    // Get customer count
    const customerCount = await prisma.customer.count({
        where: { companyId }
    });

    // Calculate growth rates (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentSales, previousSales, recentCustomers, previousCustomers] = await Promise.all([
        prisma.sale.aggregate({
            where: { companyId, date: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
            _count: true
        }),
        prisma.sale.aggregate({
            where: { companyId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            _sum: { amount: true },
            _count: true
        }),
        prisma.customer.count({
            where: { companyId, createdAt: { gte: thirtyDaysAgo } }
        }),
        prisma.customer.count({
            where: { companyId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
        })
    ]);

    const recentAmount = recentSales._sum.amount || 0;
    const previousAmount = previousSales._sum.amount || 0;
    const salesGrowth = previousAmount > 0
        ? ((recentAmount - previousAmount) / previousAmount) * 100
        : 0;

    const customerGrowth = previousCustomers > 0
        ? ((recentCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

    // Get top regions (filter null regions after grouping)
    const topRegionsRaw = await prisma.sale.groupBy({
        by: ['region'],
        where: {
            companyId,
            ...dateFilter
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
    });
    const topRegions = topRegionsRaw.filter(r => r.region !== null).slice(0, 5);

    // Get top products (filter null products after grouping)
    const topProductsRaw = await prisma.sale.groupBy({
        by: ['product'],
        where: {
            companyId,
            ...dateFilter
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } }
    });
    const topProducts = topProductsRaw.filter(p => p.product !== null).slice(0, 5);

    // Get channel mix
    const channelMix = await prisma.sale.groupBy({
        by: ['channel'],
        where: { companyId, ...dateFilter },
        _sum: { amount: true },
        _count: true
    });

    const totalRevenue = salesStats._sum.amount || 0;
    const channelData = channelMix.map(item => ({
        channel: item.channel,
        revenue: item._sum.amount || 0,
        count: item._count,
        percentage: totalRevenue > 0 ? ((item._sum.amount || 0) / totalRevenue) * 100 : 0
    }));

    // Calculate campaign metrics
    const totalSpend = campaignStats._sum.spend || 0;
    const totalImpressions = campaignStats._sum.impressions || 0;
    const totalClicks = campaignStats._sum.clicks || 0;
    const totalConversions = campaignStats._sum.conversions || 0;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const costPerLead = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const roi = totalSpend > 0 ? ((recentAmount - totalSpend) / totalSpend) * 100 : 0;

    const overview = {
        // Sales metrics
        totalRevenue,
        totalSales: salesStats._count,
        avgOrderValue: salesStats._avg.amount || 0,
        salesGrowth,

        // Customer metrics
        totalCustomers: customerCount,
        newCustomers: recentCustomers,
        customerGrowth,

        // Campaign metrics
        totalCampaigns: campaignStats._count,
        activeCampaigns: await prisma.campaign.count({
            where: {
                companyId,
                status: 'active'
            }
        }),
        totalCampaignSpend: totalSpend,
        campaignROI: roi,
        ctr,
        conversionRate,
        costPerLead,

        // Top performers
        topRegions: topRegions.map(r => ({
            region: r.region,
            revenue: r._sum.amount || 0,
            count: r._count,
            percentage: totalRevenue > 0 ? ((r._sum.amount || 0) / totalRevenue) * 100 : 0
        })),
        topProducts: topProducts.map(p => ({
            product: p.product,
            revenue: p._sum.amount || 0,
            count: p._count
        })),
        channelMix: channelData
    };

    await setCachedData(cacheKey, overview, 300);

    res.json({
        success: true,
        data: overview
    });
});

/**
 * Get sales trend with forecast
 * GET /api/analytics/sales-trend
 */
export const getSalesTrend = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { startDate, endDate, groupBy = 'day', includeForecast = 'false' } = req.query;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
        start.setDate(start.getDate() - 90); // Default to 90 days
    }

    const cacheKey = `analytics:sales-trend:v2:${companyId}:${start.toISOString()}:${end.toISOString()}:${groupBy}:${includeForecast}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached,
            cached: true
        });
    }

    const sales = await prisma.sale.findMany({
        where: {
            companyId,
            date: { gte: start, lte: end }
        },
        select: {
            date: true,
            amount: true,
            category: true
        },
        orderBy: { date: 'asc' }
    });

    // Group by date
    const grouped = {};
    const categoryData = {};

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

        // Track by category
        if (sale.category) {
            if (!categoryData[sale.category]) {
                categoryData[sale.category] = {};
            }
            if (!categoryData[sale.category][key]) {
                categoryData[sale.category][key] = { date: key, amount: 0 };
            }
            categoryData[sale.category][key].amount += sale.amount;
        }
    });

    const trend = Object.values(grouped).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // Category-wise trends
    const categoryTrends = Object.entries(categoryData).map(([category, data]) => ({
        category,
        data: Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    let forecast = null;
    if (includeForecast === 'true' && trend.length > 0) {
        forecast = await geminiService.generateSalesForecast(trend, {
            period: 30,
            unit: 'days'
        });
    }

    const result = {
        trend,
        categoryTrends,
        forecast
    };

    await setCachedData(cacheKey, result, 300);

    res.json({
        success: true,
        data: result
    });
});

/**
 * Get customer insights with segmentation and CLV
 * GET /api/analytics/customer-insights
 */
export const getCustomerInsights = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:customer-insights:v2:${companyId}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached,
            cached: true
        });
    }

    // Get all customers
    const customers = await prisma.customer.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
        }
    });

    // Get sales per customer (filter null customers after grouping)
    const customerSalesRaw = await prisma.sale.groupBy({
        by: ['customerId'],
        where: {
            companyId
        },
        _sum: { amount: true },
        _count: true
    });
    const customerSales = customerSalesRaw.filter(c => c.customerId !== null);

    const customerSalesMap = customerSales.reduce((map, item) => {
        map[item.customerId] = {
            totalSpend: item._sum.amount || 0,
            purchaseCount: item._count
        };
        return map;
    }, {});

    // Calculate metrics
    const totalCustomers = customers.length;
    const customersWithPurchases = customerSales.length;
    const totalLifetimeValue = customerSales.reduce((sum, c) => sum + (c._sum.amount || 0), 0);
    const avgLifetimeValue = customersWithPurchases > 0 ? totalLifetimeValue / customersWithPurchases : 0;

    // New vs returning (customers with 2+ purchases)
    const returningCustomers = customerSales.filter(c => c._count >= 2).length;
    const newCustomers = customersWithPurchases - returningCustomers;
    const repeatPurchaseRate = customersWithPurchases > 0 ? (returningCustomers / customersWithPurchases) * 100 : 0;

    // Top customers
    const topCustomers = customerSales
        .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
        .slice(0, 10)
        .map(cs => {
            const customer = customers.find(c => c.id === cs.customerId);
            return {
                id: cs.customerId,
                name: customer?.name || 'Unknown',
                email: customer?.email,
                totalSpend: cs._sum.amount || 0,
                purchaseCount: cs._count
            };
        });

    // Get region segments from Sale data instead (since Customer doesn't have region)
    const regionSegmentsRaw = await prisma.sale.groupBy({
        by: ['region'],
        where: { companyId },
        _count: true
    });
    const regionSegments = regionSegmentsRaw.filter(r => r.region !== null);

    // Retention trend (monthly new customers)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCustomers = await prisma.customer.findMany({
        where: {
            companyId,
            createdAt: { gte: sixMonthsAgo }
        },
        select: { createdAt: true }
    });

    const retentionTrend = {};
    monthlyCustomers.forEach(c => {
        const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
        retentionTrend[monthKey] = (retentionTrend[monthKey] || 0) + 1;
    });

    // Get AI insights
    const customerData = {
        totalCustomers,
        avgLifetimeValue,
        repeatPurchaseRate,
        newCustomers,
        returningCustomers
    };

    const recentSales = await prisma.sale.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
        take: 100,
        select: {
            amount: true,
            date: true,
            customerId: true,
            category: true
        }
    });

    const aiInsights = await geminiService.analyzeCustomerBehavior(customerData, recentSales);

    const insights = {
        totalCustomers,
        customersWithPurchases,
        newCustomers,
        returningCustomers,
        repeatPurchaseRate,
        avgLifetimeValue,
        totalLifetimeValue,
        topCustomers,
        segments: regionSegments.map(r => ({
            region: r.region,
            count: r._count,
            percentage: totalCustomers > 0 ? (r._count / totalCustomers) * 100 : 0
        })),
        retentionTrend: Object.entries(retentionTrend)
            .map(([month, count]) => ({ month, newCustomers: count }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        aiInsights
    };

    await setCachedData(cacheKey, insights, 300);

    res.json({
        success: true,
        data: insights
    });
});

/**
 * Get campaign analytics with ROI and performance metrics
 * GET /api/analytics/campaign-analytics
 */
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:campaign-analytics:v2:${companyId}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached,
            cached: true
        });
    }

    const campaigns = await prisma.campaign.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            platform: true,
            status: true,
            spend: true,
            impressions: true,
            clicks: true,
            conversions: true,
            startDate: true,
            endDate: true
        }
    });

    // Calculate metrics for each campaign
    const campaignMetrics = campaigns.map(campaign => {
        const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
        const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
        const costPerClick = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;
        const costPerLead = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0;

        // Estimate revenue (assuming avg conversion value)
        const estimatedRevenue = campaign.conversions * 100; // Placeholder
        const roi = campaign.spend > 0 ? ((estimatedRevenue - campaign.spend) / campaign.spend) * 100 : 0;

        return {
            id: campaign.id,
            name: campaign.name,
            platform: campaign.platform,
            status: campaign.status,
            spend: campaign.spend,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            conversions: campaign.conversions,
            ctr,
            conversionRate,
            costPerClick,
            costPerLead,
            roi,
            startDate: campaign.startDate,
            endDate: campaign.endDate
        };
    });

    // Aggregate stats
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgCostPerLead = totalConversions > 0 ? totalSpend / totalConversions : 0;

    // Channel efficiency
    const channelPerformance = await prisma.campaign.groupBy({
        by: ['platform'],
        where: { companyId },
        _sum: {
            spend: true,
            impressions: true,
            clicks: true,
            conversions: true
        },
        _count: true
    });

    const channelEfficiency = channelPerformance.map(ch => ({
        platform: ch.platform,
        campaigns: ch._count,
        spend: ch._sum.spend || 0,
        impressions: ch._sum.impressions || 0,
        clicks: ch._sum.clicks || 0,
        conversions: ch._sum.conversions || 0,
        ctr: (ch._sum.impressions || 0) > 0 ? ((ch._sum.clicks || 0) / (ch._sum.impressions || 0)) * 100 : 0,
        conversionRate: (ch._sum.clicks || 0) > 0 ? ((ch._sum.conversions || 0) / (ch._sum.clicks || 0)) * 100 : 0
    }));

    // Best and worst performers
    const sortedByROI = [...campaignMetrics].sort((a, b) => b.roi - a.roi);
    const topPerformers = sortedByROI.slice(0, 5);
    const underperformers = sortedByROI.slice(-5).reverse();

    // Get AI insights
    const aiInsights = await geminiService.analyzeCampaignPerformance(campaignMetrics);

    const analytics = {
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalCampaigns: campaigns.length,
        totalSpend: totalSpend,
        avgCTR,
        avgConversionRate,
        avgCostPerLead,
        totalImpressions,
        totalClicks,
        totalConversions,
        campaigns: campaignMetrics,
        topPerformers,
        underperformers,
        channelEfficiency,
        aiInsights
    };

    await setCachedData(cacheKey, analytics, 300);

    res.json({
        success: true,
        data: analytics
    });
});

/**
 * Get AI-powered business insights
 * GET /api/analytics/ai-insights
 */
export const getAIInsights = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const cacheKey = `analytics:ai-insights:${companyId}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached,
            cached: true
        });
    }

    // Gather all analytics data
    const [salesStats, customerCount, campaignStats] = await Promise.all([
        prisma.sale.aggregate({
            where: { companyId },
            _sum: { amount: true },
            _count: true
        }),
        prisma.customer.count({ where: { companyId } }),
        prisma.campaign.aggregate({
            where: { companyId },
            _sum: { spend: true },
            _count: true
        })
    ]);

    const analyticsData = {
        totalRevenue: salesStats._sum.amount || 0,
        totalSales: salesStats._count,
        totalCustomers: customerCount,
        totalCampaigns: campaignStats._count,
        totalCampaignSpend: campaignStats._sum.spend || 0
    };

    const insights = await geminiService.generateBusinessInsights(analyticsData);

    await setCachedData(cacheKey, insights, 600);

    res.json({
        success: true,
        data: insights,
        geminiEnabled: geminiService.isConfigured()
    });
});

/**
 * Clear analytics cache
 * DELETE /api/analytics/cache
 */
export const clearCache = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Clear all analytics caches for this company
    const keys = await redis.keys(`analytics:*:${companyId}*`);
    if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
    }

    res.json({
        success: true,
        message: `Cleared ${keys.length} cache entries`
    });
});
