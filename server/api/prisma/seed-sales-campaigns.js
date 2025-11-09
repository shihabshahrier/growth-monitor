import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
    console.log("🌱 Seeding database with Sales and Campaigns data...\n");

    const passwordHash = await bcrypt.hash("password123", 12);

    // ============================================================
    // SETUP: Create company and users
    // ============================================================
    const company = await prisma.company.upsert({
        where: { id: "demo-company-id" },
        update: {},
        create: {
            id: "demo-company-id",
            name: "GrowthMonitor Demo",
            industry: "E-commerce",
        },
    });
    console.log("✓ Company created: GrowthMonitor Demo");

    const owner = await prisma.user.upsert({
        where: { email: "demo@growthmonitor.ai" },
        update: {},
        create: {
            name: "Demo Owner",
            email: "demo@growthmonitor.ai",
            passwordHash,
            role: "OWNER",
            companyId: company.id,
        },
    });

    const admin = await prisma.user.upsert({
        where: { email: "admin@growthmonitor.ai" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@growthmonitor.ai",
            passwordHash,
            role: "ADMIN",
            companyId: company.id,
        },
    });

    const member = await prisma.user.upsert({
        where: { email: "member@growthmonitor.ai" },
        update: {},
        create: {
            name: "Team Member",
            email: "member@growthmonitor.ai",
            passwordHash,
            role: "MEMBER",
            companyId: company.id,
        },
    });
    console.log("✓ Users created: 1 Owner, 1 Admin, 1 Member\n");

    // ============================================================
    // CLEAR existing data for this company
    // ============================================================
    console.log("🧹 Clearing existing data...");
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.insight.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log("✓ All data cleared\n");

    // ============================================================
    // CREATE SALES DATA
    // ============================================================
    console.log("📊 Creating sales data...");

    const channels = ["Website", "WhatsApp", "Facebook", "Instagram", "Email", "Direct", "Mobile App"];
    const regions = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"];
    const categories = ["Apparel", "Electronics", "Home & Garden", "Sports", "Books"];
    const salesReps = ["Ahmed Khan", "Fatima Rahman", "Karim Hassan", "Noor Alam", "Zainab Ali"];
    const products = {
        Apparel: ["T-Shirt", "Jeans", "Dress", "Jacket", "Sweater"],
        Electronics: ["Laptop", "Phone", "Headphones", "Tablet", "Charger"],
        "Home & Garden": ["Pillow", "Lamp", "Rug", "Plant Pot", "Blanket"],
        Sports: ["Yoga Mat", "Dumbbells", "Running Shoes", "Bicycle", "Water Bottle"],
        Books: ["Fiction Novel", "Self-Help", "Technical Guide", "Magazine", "Comic Book"],
    };

    const salesData = [];
    const now = new Date();

    // Generate 200 sales transactions over the last 90 days
    for (let i = 0; i < 200; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const category = categories[Math.floor(Math.random() * categories.length)];
        const product = products[category][Math.floor(Math.random() * products[category].length)];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const salesRep = salesReps[Math.floor(Math.random() * salesReps.length)];

        // Price varies by category
        let basePrice = 1000;
        if (category === "Electronics") basePrice = 15000;
        if (category === "Apparel") basePrice = 2000;
        if (category === "Sports") basePrice = 5000;

        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = basePrice + Math.floor(Math.random() * basePrice * 0.5);
        const amount = quantity * unitPrice;

        salesData.push({
            userId: [owner.id, admin.id, member.id][i % 3],
            companyId: company.id,
            date,
            orderId: `ORD-${String(i + 1).padStart(6, "0")}`,
            product,
            category,
            region,
            channel,
            quantity,
            unitPrice,
            amount,
            paymentMethod: ["Credit Card", "Cash", "Bank Transfer", "Mobile Payment"][Math.floor(Math.random() * 4)],
            salesRep,
            remarks: `Sale via ${channel} in ${region}`,
        });
    }

    await prisma.sale.createMany({ data: salesData });
    console.log(`✓ Created 200 sales transactions\n`);

    // ============================================================
    // CREATE CAMPAIGN DATA
    // ============================================================
    console.log("📢 Creating campaign data...");

    const platforms = ["Facebook", "WhatsApp", "Google Ads", "Instagram", "Email", "LinkedIn", "TikTok"];
    const campaignStatuses = ["Active", "Completed", "Paused"];

    const campaignsData = [];
    const campaignNames = [
        "Eid Festival Sale",
        "Summer Clearance",
        "Black Friday Early Bird",
        "New Product Launch",
        "Customer Loyalty Program",
        "Back to School",
        "Winter Collection",
        "Flash Sale Weekend",
        "Brand Awareness Push",
        "Lead Generation Q4",
    ];

    for (let i = 0; i < campaignNames.length; i++) {
        const startDate = new Date(now.getTime() - (90 - i * 8) * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const platform = platforms[i % platforms.length];

        // Generate realistic campaign metrics
        const spend = 5000 + Math.random() * 45000;
        const impressions = Math.floor(spend * (100 + Math.random() * 400));
        const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.08));
        const responses = Math.floor(clicks * (0.05 + Math.random() * 0.2));
        const conversions = Math.floor(responses * (0.2 + Math.random() * 0.5));
        const revenueGenerated = conversions * (3000 + Math.random() * 7000);

        campaignsData.push({
            userId: [owner.id, admin.id, member.id][i % 3],
            companyId: company.id,
            name: campaignNames[i],
            platform,
            region: regions[i % regions.length],
            startDate,
            endDate,
            spend,
            impressions,
            clicks,
            responses,
            conversions,
            revenueGenerated,
            salesRep: salesReps[i % salesReps.length],
            status: campaignStatuses[i % campaignStatuses.length],
            remarks: `${platform} campaign targeting ${regions[i % regions.length]}`,
        });
    }

    await prisma.campaign.createMany({ data: campaignsData });
    console.log(`✓ Created 10 campaigns\n`);

    // ============================================================
    // CREATE INSIGHTS BASED ON DATA
    // ============================================================
    console.log("💡 Creating insights...");

    // Calculate some metrics for insights
    const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
    const avgSaleValue = totalSales / salesData.length;
    const channelSalesMap = {};
    const categorySalesMap = {};
    const regionSalesMap = {};

    salesData.forEach((sale) => {
        channelSalesMap[sale.channel] = (channelSalesMap[sale.channel] || 0) + sale.amount;
        categorySalesMap[sale.category] = (categorySalesMap[sale.category] || 0) + sale.amount;
        regionSalesMap[sale.region] = (regionSalesMap[sale.region] || 0) + sale.amount;
    });

    const topChannel = Object.entries(channelSalesMap).sort(([, a], [, b]) => b - a)[0];
    const topCategory = Object.entries(categorySalesMap).sort(([, a], [, b]) => b - a)[0];
    const topRegion = Object.entries(regionSalesMap).sort(([, a], [, b]) => b - a)[0];

    const totalCampaignSpend = campaignsData.reduce((sum, c) => sum + c.spend, 0);
    const totalCampaignRevenue = campaignsData.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
    const campaignROI = ((totalCampaignRevenue - totalCampaignSpend) / totalCampaignSpend) * 100;

    await prisma.insight.createMany({
        data: [
            {
                userId: owner.id,
                companyId: company.id,
                title: "Channel Performance Analysis",
                summary: `${topChannel[0]} is your top performing channel with ${Math.round(topChannel[1] / totalSales * 100)}% of total sales revenue`,
                data: {
                    type: "opportunity",
                    metrics: {
                        topChannel: topChannel[0],
                        topChannelRevenue: topChannel[1],
                        totalRevenue: totalSales,
                        percentOfTotal: Math.round(topChannel[1] / totalSales * 100),
                    },
                    allChannels: channelSalesMap,
                    recommendations: [
                        `Increase marketing spend on ${topChannel[0]}`,
                        "Optimize underperforming channels",
                        "Test new channels for expansion",
                    ],
                },
            },
            {
                userId: owner.id,
                companyId: company.id,
                title: "Category Performance Insights",
                summary: `${topCategory[0]} leads in revenue with ${Math.round(topCategory[1] / totalSales * 100)}% of total sales`,
                data: {
                    type: "trend",
                    metrics: {
                        topCategory: topCategory[0],
                        topCategoryRevenue: topCategory[1],
                        totalRevenue: totalSales,
                        percentOfTotal: Math.round(topCategory[1] / totalSales * 100),
                    },
                    allCategories: categorySalesMap,
                    recommendations: [
                        `Focus inventory on ${topCategory[0]}`,
                        "Create targeted campaigns for high-margin products",
                        "Analyze underperforming categories",
                    ],
                },
            },
            {
                userId: admin.id,
                companyId: company.id,
                title: "Regional Sales Distribution",
                summary: `${topRegion[0]} is your strongest market with ${Math.round(topRegion[1] / totalSales * 100)}% of regional sales`,
                data: {
                    type: "analysis",
                    metrics: {
                        topRegion: topRegion[0],
                        topRegionRevenue: topRegion[1],
                        totalRevenue: totalSales,
                        percentOfTotal: Math.round(topRegion[1] / totalSales * 100),
                    },
                    allRegions: regionSalesMap,
                    recommendations: [
                        `Expand operations in ${topRegion[0]}`,
                        "Investigate why other regions underperform",
                        "Local market strategies for growth",
                    ],
                },
            },
            {
                userId: owner.id,
                companyId: company.id,
                title: "Campaign ROI Overview",
                summary: `Campaign portfolio showing ${campaignROI > 0 ? "positive" : "negative"} ROI of ${campaignROI.toFixed(1)}%`,
                data: {
                    type: "performance",
                    metrics: {
                        totalSpend: totalCampaignSpend,
                        totalRevenue: totalCampaignRevenue,
                        roi: campaignROI,
                        numberOfCampaigns: campaignsData.length,
                    },
                    bestPerformer: campaignsData.reduce((best, curr) =>
                        ((curr.revenueGenerated || 0) - curr.spend) > ((best.revenueGenerated || 0) - best.spend) ? curr : best
                    ),
                    recommendations: [
                        "Scale high-performing campaigns",
                        "Pause low-ROI campaigns",
                        "A/B test ad creatives",
                    ],
                },
            },
        ],
    });
    console.log("✓ Created 4 insights\n");

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log("═".repeat(60));
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("═".repeat(60) + "\n");

    console.log("📊 Data Summary:");
    console.log(`   • Company: ${company.name}`);
    console.log(`   • Users: 3 (1 Owner, 1 Admin, 1 Member)`);
    console.log(`   • Sales Transactions: ${salesData.length}`);
    console.log(`     - Total Revenue: ৳${(totalSales / 1000).toFixed(1)}K`);
    console.log(`     - Average Order Value: ৳${avgSaleValue.toFixed(0)}`);
    console.log(`     - Top Channel: ${topChannel[0]} (৳${(topChannel[1] / 1000).toFixed(1)}K)`);
    console.log(`     - Top Category: ${topCategory[0]} (৳${(topCategory[1] / 1000).toFixed(1)}K)`);
    console.log(`     - Top Region: ${topRegion[0]} (৳${(topRegion[1] / 1000).toFixed(1)}K)`);
    console.log(`   • Campaigns: ${campaignsData.length}`);
    console.log(`     - Total Spend: ৳${(totalCampaignSpend / 1000).toFixed(1)}K`);
    console.log(`     - Total Revenue Generated: ৳${(totalCampaignRevenue / 1000).toFixed(1)}K`);
    console.log(`     - Portfolio ROI: ${campaignROI.toFixed(1)}%`);
    console.log(`   • Insights: 4`);

    console.log("\n🔑 Test Credentials:");
    console.log(`   Email: demo@growthmonitor.ai`);
    console.log(`   Password: password123`);

    console.log("\n📈 Sales Data Spans:");
    console.log(`   • Date Range: Last 90 days`);
    console.log(`   • Channels: ${Object.keys(channelSalesMap).join(", ")}`);
    console.log(`   • Regions: ${regions.join(", ")}`);
    console.log(`   • Categories: ${categories.join(", ")}`);

    console.log("\n📢 Campaign Data:");
    console.log(`   • Platforms: ${platforms.slice(0, 5).join(", ")} ...`);
    console.log(`   • Status Mix: Active, Completed, Paused`);

    console.log("\n✅ Database is ready for AI Worker testing!");
    console.log("═".repeat(60) + "\n");
};

seed()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
