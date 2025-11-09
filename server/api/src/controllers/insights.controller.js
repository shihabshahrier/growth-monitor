import { prisma } from "../services/prisma.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { geminiService } from "../services/gemini.service.js";

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
      companyId: req.user.companyId,
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

export const getInsight = asyncHandler(async (req, res) => {
  const { insightId } = req.params;

  const insight = await prisma.insight.findFirst({
    where: { id: insightId, userId: req.user.id },
  });

  if (!insight) {
    return res.status(404).json({ message: "Insight not found" });
  }

  res.json({ insight });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { insightId } = req.params;

  const existing = await prisma.insight.findFirst({
    where: { id: insightId, userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Insight not found" });
  }

  const insight = await prisma.insight.update({
    where: { id: insightId },
    data: { read: true },
  });

  res.json({ insight });
});

export const generateInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "User must belong to a company"
    });
  }

  // Gather analytics data for AI analysis
  const [sales, campaigns, customers] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        amount: true,
        date: true,
        category: true,
        product: true,
        region: true
      }
    }),
    prisma.campaign.findMany({
      where: { companyId },
      select: {
        name: true,
        platform: true,
        status: true,
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true
      }
    }),
    prisma.customer.findMany({
      where: { companyId },
      select: {
        id: true,
        createdAt: true,
        sales: {
          select: { amount: true }
        }
      }
    })
  ]);

  // Calculate basic metrics
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
  const totalCampaignSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const customerCount = customers.length;

  // Prepare data for AI
  const analyticsData = {
    salesSummary: {
      totalRevenue,
      averageSale: avgSale,
      transactionCount: sales.length,
      recentSales: sales.slice(0, 10)
    },
    campaignSummary: {
      totalSpend: totalCampaignSpend,
      totalConversions,
      campaignCount: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      campaigns: campaigns.slice(0, 5)
    },
    customerSummary: {
      totalCustomers: customerCount,
      newCustomersThisMonth: customers.filter(c => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(c.createdAt) > monthAgo;
      }).length
    }
  };

  // Generate AI insights using Gemini
  const aiInsights = await geminiService.generateBusinessInsights(analyticsData);

  // Transform AI insights into database format
  const insightsToCreate = [];

  // Add key findings as insights
  if (aiInsights.keyFindings && aiInsights.keyFindings.length > 0) {
    aiInsights.keyFindings.slice(0, 3).forEach(finding => {
      insightsToCreate.push({
        title: finding.title || finding,
        summary: finding.description || finding,
        type: 'trend',
        data: { category: 'key_finding', source: 'ai' }
      });
    });
  }

  // Add opportunities
  if (aiInsights.opportunities && aiInsights.opportunities.length > 0) {
    aiInsights.opportunities.slice(0, 2).forEach(opp => {
      insightsToCreate.push({
        title: opp.title || opp,
        summary: opp.description || opp,
        type: 'opportunity',
        data: { category: 'growth_opportunity', source: 'ai' }
      });
    });
  }

  // Add warnings
  if (aiInsights.warnings && aiInsights.warnings.length > 0) {
    aiInsights.warnings.slice(0, 2).forEach(warning => {
      insightsToCreate.push({
        title: warning.title || warning,
        summary: warning.description || warning,
        type: 'warning',
        data: { category: 'risk', source: 'ai' }
      });
    });
  }

  // Add top recommendation
  if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
    const topRec = aiInsights.recommendations[0];
    insightsToCreate.push({
      title: topRec.title || topRec,
      summary: topRec.description || topRec,
      type: 'recommendation',
      data: {
        category: 'action_item',
        priority: 'high',
        source: 'ai'
      }
    });
  }

  // If no AI insights or to supplement them, create basic insights from data
  if (insightsToCreate.length === 0) {
    // No data scenario
    if (totalRevenue === 0 && campaigns.length === 0 && customerCount === 0) {
      insightsToCreate.push({
        title: "Getting Started",
        summary: "Start by adding your first customers, sales, and campaigns to unlock powerful AI-driven insights about your business.",
        type: 'recommendation',
        data: { category: 'onboarding', source: 'system' }
      });
      insightsToCreate.push({
        title: "Import Your Data",
        summary: "Use the import feature to quickly add existing customer and sales data. This will help generate more accurate insights and forecasts.",
        type: 'opportunity',
        data: { category: 'data_import', source: 'system' }
      });
    } else {
      // Has some data - provide meaningful insights
      if (totalRevenue > 0) {
        const avgSaleValue = avgSale > 0 ? avgSale : 0;
        insightsToCreate.push({
          title: "Revenue Performance",
          summary: `Total revenue of $${totalRevenue.toFixed(2)} from ${sales.length} transactions. Average sale value: $${avgSaleValue.toFixed(2)}.`,
          type: 'trend',
          data: { revenue: totalRevenue, transactions: sales.length, avgSale: avgSaleValue, source: 'system' }
        });
      }

      if (campaigns.length > 0) {
        const roi = totalCampaignSpend > 0 ? ((totalRevenue - totalCampaignSpend) / totalCampaignSpend * 100) : 0;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

        if (roi > 0) {
          insightsToCreate.push({
            title: "Positive Campaign ROI",
            summary: `Your ${campaigns.length} campaigns are generating positive returns with ${totalConversions} conversions. Current ROI: ${roi.toFixed(1)}%.`,
            type: 'opportunity',
            data: { campaigns: campaigns.length, conversions: totalConversions, roi: roi.toFixed(1), activeCampaigns, source: 'system' }
          });
        } else if (totalCampaignSpend > 0) {
          insightsToCreate.push({
            title: "Review Campaign Strategy",
            summary: `Campaign spending ($${totalCampaignSpend.toFixed(2)}) needs optimization. Consider analyzing which campaigns deliver the best conversion rates.`,
            type: 'warning',
            data: { campaigns: campaigns.length, spend: totalCampaignSpend, conversions: totalConversions, source: 'system' }
          });
        }
      }

      if (customerCount > 0) {
        const newCustomersThisMonth = customers.filter(c => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return new Date(c.createdAt) > monthAgo;
        }).length;

        insightsToCreate.push({
          title: "Customer Growth",
          summary: `Your customer base has grown to ${customerCount} customers with ${newCustomersThisMonth} new customers added this month.`,
          type: 'trend',
          data: { totalCustomers: customerCount, newThisMonth: newCustomersThisMonth, source: 'system' }
        });

        // Add customer engagement insight
        const customersWithPurchases = customers.filter(c => c.sales && c.sales.length > 0).length;
        if (customersWithPurchases < customerCount * 0.5) {
          insightsToCreate.push({
            title: "Increase Customer Engagement",
            summary: `${customerCount - customersWithPurchases} customers haven't made purchases yet. Consider targeted marketing campaigns to drive engagement.`,
            type: 'opportunity',
            data: { totalCustomers: customerCount, inactive: customerCount - customersWithPurchases, source: 'system' }
          });
        }
      }
    }
  }

  // Create the insights in database
  const created = await Promise.all(
    insightsToCreate.map((insight) =>
      prisma.insight.create({
        data: {
          userId,
          companyId,
          ...insight,
        },
      })
    )
  );

  res.json({
    success: true,
    message: `${created.length} insights generated successfully`,
    insights: created,
    geminiEnabled: geminiService.isConfigured()
  });
});
