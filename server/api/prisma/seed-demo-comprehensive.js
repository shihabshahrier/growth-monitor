import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedComprehensive = async () => {
    console.log("🌱 Seeding comprehensive demo data...");

    const passwordHash = await bcrypt.hash("password123", 12);

    // Create or get company
    const company = await prisma.company.upsert({
        where: { id: "demo-company-id" },
        update: {},
        create: {
            id: "demo-company-id",
            name: "GrowthMonitor Demo",
            industry: "E-commerce",
        },
    });
    console.log("✓ Company created");

    // Create owner user
    const owner = await prisma.user.upsert({
        where: { email: "demo@growthmonitor.ai" },
        update: {
            role: "OWNER",
            companyId: company.id,
        },
        create: {
            name: "Demo Owner",
            email: "demo@growthmonitor.ai",
            passwordHash,
            role: "OWNER",
            companyId: company.id,
        },
    });
    console.log("✓ Owner user created");

    // Clear existing data for clean slate
    await prisma.message.deleteMany({ where: { conversation: { userId: owner.id } } });
    await prisma.conversation.deleteMany({ where: { userId: owner.id } });
    await prisma.insight.deleteMany({ where: { companyId: company.id } });
    await prisma.sale.deleteMany({ where: { companyId: company.id } });
    await prisma.campaign.deleteMany({ where: { companyId: company.id } });
    await prisma.customer.deleteMany({ where: { companyId: company.id } });
    console.log("✓ Cleared existing data");

    // ========================================================================
    // CREATE REALISTIC CUSTOMERS
    // ========================================================================
    const customers = [];
    const customerData = [
        { name: "Sadia Ahmed", email: "sadia@gmail.com", phone: "01712345678", region: "Dhaka" },
        { name: "Rakib Khan", email: "rakib@example.com", phone: "01987654321", region: "Chattogram" },
        { name: "Tasnim Akter", email: "tasnim@gmail.com", phone: "01555666777", region: "Dhaka" },
        { name: "Imran Hossain", email: "imran@example.com", phone: "01823456789", region: "Sylhet" },
        { name: "Fatema Begum", email: "fatema@gmail.com", phone: "01734567890", region: "Dhaka" },
        { name: "Karim Rahman", email: "karim@example.com", phone: "01645678901", region: "Khulna" },
        { name: "Nusrat Jahan", email: "nusrat@gmail.com", phone: "01556789012", region: "Dhaka" },
        { name: "Sabbir Ahmed", email: "sabbir@example.com", phone: "01467890123", region: "Chattogram" },
        { name: "Rima Akter", email: "rima@gmail.com", phone: "01378901234", region: "Rajshahi" },
        { name: "Tanvir Islam", email: "tanvir@example.com", phone: "01289012345", region: "Dhaka" },
        { name: "Ayesha Khatun", email: "ayesha@gmail.com", phone: "01790123456", region: "Barisal" },
        { name: "Mehedi Hasan", email: "mehedi@example.com", phone: "01601234567", region: "Sylhet" },
        { name: "Sharmin Sultana", email: "sharmin@gmail.com", phone: "01512345678", region: "Dhaka" },
        { name: "Fahim Ahmed", email: "fahim@example.com", phone: "01423456789", region: "Chattogram" },
        { name: "Nabila Tabassum", email: "nabila@gmail.com", phone: "01834567890", region: "Dhaka" },
    ];

    for (const data of customerData) {
        const customer = await prisma.customer.create({
            data: {
                companyId: company.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                metadata: { region: data.region, source: "Website" },
            },
        });
        customers.push({ ...customer, region: data.region });
    }
    console.log(`✓ Created ${customers.length} customers`);

    // ========================================================================
    // CREATE COMPREHENSIVE SALES DATA (Last 90 days)
    // ========================================================================
    const products = [
        { name: "Women's Kurti", category: "Apparel", price: 1200, channel: "Facebook" },
        { name: "Men's Shirt", category: "Apparel", price: 800, channel: "WhatsApp" },
        { name: "Handmade Bag", category: "Accessories", price: 2500, channel: "In-store" },
        { name: "Notebook Set", category: "Stationery", price: 150, channel: "Facebook" },
        { name: "Women's Saree", category: "Apparel", price: 3500, channel: "Website" },
        { name: "Men's Panjabi", category: "Apparel", price: 1800, channel: "WhatsApp" },
        { name: "Leather Wallet", category: "Accessories", price: 600, channel: "In-store" },
        { name: "Winter Jacket", category: "Apparel", price: 4200, channel: "Facebook" },
        { name: "Women's Dress", category: "Apparel", price: 1500, channel: "Website" },
        { name: "Men's Jeans", category: "Apparel", price: 1200, channel: "WhatsApp" },
        { name: "Jewelry Set", category: "Accessories", price: 5000, channel: "In-store" },
        { name: "Children's Toy", category: "Toys", price: 450, channel: "Facebook" },
        { name: "Home Decor", category: "Home", price: 1800, channel: "Website" },
        { name: "Kitchen Set", category: "Home", price: 3200, channel: "In-store" },
        { name: "Sports Shoes", category: "Footwear", price: 2800, channel: "WhatsApp" },
    ];

    const salesReps = ["Arif Hasan", "Fatema Begum", "Sadia Ahmed", "Kamal Uddin"];
    const paymentMethods = ["bKash", "Nagad", "Cash", "Card", "Rocket"];
    const regions = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barisal"];

    const salesData = [];
    const today = new Date();

    // Generate 200 sales over the last 90 days with realistic patterns
    for (let i = 0; i < 200; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const saleDate = new Date(today);
        saleDate.setDate(saleDate.getDate() - daysAgo);

        const product = products[Math.floor(Math.random() * products.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 items
        const unitPrice = product.price;
        const totalAmount = quantity * unitPrice;

        salesData.push({
            userId: owner.id,
            companyId: company.id,
            customerId: customer.id,
            date: saleDate,
            orderId: `ORD-${9000 + i}`,
            product: product.name,
            category: product.category,
            region: customer.region || regions[Math.floor(Math.random() * regions.length)],
            channel: product.channel,
            quantity: quantity,
            unitPrice: unitPrice,
            amount: totalAmount,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            salesRep: salesReps[Math.floor(Math.random() * salesReps.length)],
            remarks: i % 10 === 0 ? "VIP customer" : i % 15 === 0 ? "Bulk order" : null,
        });
    }

    await prisma.sale.createMany({ data: salesData });
    console.log(`✓ Created ${salesData.length} sales records`);

    // ========================================================================
    // CREATE COMPREHENSIVE CAMPAIGNS WITH FULL METRICS
    // ========================================================================
    const campaignsData = [
        {
            name: "Eid Mega Sale 2025",
            platform: "Facebook",
            region: "Dhaka",
            startDate: new Date("2025-03-15"),
            endDate: new Date("2025-03-30"),
            spend: 25000,
            impressions: 120000,
            clicks: 2500,
            responses: 150,
            conversions: 45,
            revenueGenerated: 72000,
            status: "Completed",
            salesRep: "Arif Hasan",
            remarks: "Best performing campaign, retargeted Eid 2024 list",
        },
        {
            name: "Summer Collection Launch",
            platform: "WhatsApp",
            region: "Dhaka",
            startDate: new Date("2025-06-01"),
            endDate: new Date("2025-06-15"),
            spend: 15000,
            impressions: 50000,
            clicks: 1800,
            responses: 120,
            conversions: 38,
            revenueGenerated: 58000,
            status: "Completed",
            salesRep: "Fatema Begum",
            remarks: "Good engagement with WhatsApp broadcast",
        },
        {
            name: "Black Friday Bangladesh",
            platform: "Google",
            region: null,
            startDate: new Date("2025-11-20"),
            endDate: null,
            spend: 35000,
            impressions: 250000,
            clicks: 4200,
            responses: 280,
            conversions: 72,
            revenueGenerated: 145000,
            status: "Active",
            salesRep: "Sadia Ahmed",
            remarks: "High ROI, continuing for week 2",
        },
        {
            name: "Chattogram Winter Festival",
            platform: "Facebook",
            region: "Chattogram",
            startDate: new Date("2025-10-01"),
            endDate: new Date("2025-10-20"),
            spend: 18000,
            impressions: 85000,
            clicks: 1650,
            responses: 95,
            conversions: 22,
            revenueGenerated: 38000,
            status: "Completed",
            salesRep: "Kamal Uddin",
            remarks: "Underperformed due to local competition",
        },
        {
            name: "National Apparel Week",
            platform: "Instagram",
            region: null,
            startDate: new Date("2025-09-05"),
            endDate: new Date("2025-09-12"),
            spend: 12000,
            impressions: 95000,
            clicks: 2100,
            responses: 145,
            conversions: 41,
            revenueGenerated: 68000,
            status: "Completed",
            salesRep: "Arif Hasan",
            remarks: "Instagram stories performed exceptionally well",
        },
        {
            name: "Dhaka Fashion Week Promo",
            platform: "Facebook",
            region: "Dhaka",
            startDate: new Date("2025-08-15"),
            endDate: new Date("2025-08-25"),
            spend: 22000,
            impressions: 130000,
            clicks: 2800,
            responses: 180,
            conversions: 55,
            revenueGenerated: 98000,
            status: "Completed",
            salesRep: "Fatema Begum",
            remarks: "Leveraged fashion week buzz",
        },
        {
            name: "Back to School Campaign",
            platform: "WhatsApp",
            region: "Dhaka",
            startDate: new Date("2025-01-10"),
            endDate: new Date("2025-01-30"),
            spend: 8000,
            impressions: 35000,
            clicks: 950,
            responses: 68,
            conversions: 28,
            revenueGenerated: 42000,
            status: "Completed",
            salesRep: "Sadia Ahmed",
            remarks: "Targeted parents groups",
        },
        {
            name: "Sylhet Tea Festival Sponsorship",
            platform: "In-store",
            region: "Sylhet",
            startDate: new Date("2025-07-01"),
            endDate: new Date("2025-07-10"),
            spend: 10000,
            impressions: 15000,
            clicks: 450,
            responses: 42,
            conversions: 18,
            revenueGenerated: 28000,
            status: "Completed",
            salesRep: "Kamal Uddin",
            remarks: "Pop-up store at festival",
        },
    ];

    for (const data of campaignsData) {
        await prisma.campaign.create({
            data: {
                userId: owner.id,
                companyId: company.id,
                ...data,
            },
        });
    }
    console.log(`✓ Created ${campaignsData.length} campaigns with full metrics`);

    // ========================================================================
    // CREATE AI INSIGHTS
    // ========================================================================
    const insightsData = [
        {
            title: "Facebook Campaigns Show Highest ROI",
            summary: "Facebook campaigns have generated 4.2x ROI compared to 2.8x on other platforms. Consider reallocating 20% more budget to Facebook.",
            type: "recommendation",
            data: {
                platform: "Facebook",
                avgROI: 4.2,
                totalRevenue: 208000,
                totalSpend: 50000,
            },
        },
        {
            title: "Dhaka Region Dominates Sales",
            summary: "Dhaka accounts for 62% of total revenue. Consider expanding presence in Chattogram and Sylhet for growth.",
            type: "trend",
            data: {
                region: "Dhaka",
                revenueShare: 62,
                salesCount: 124,
            },
        },
        {
            title: "Apparel Category Drives 68% of Revenue",
            summary: "Apparel products have the highest demand. Stock up on Women's Kurtis and Men's Panjabis for upcoming season.",
            type: "opportunity",
            data: {
                category: "Apparel",
                revenueShare: 68,
                topProducts: ["Women's Kurti", "Men's Panjabi", "Women's Saree"],
            },
        },
        {
            title: "15 Customers at Risk of Churning",
            summary: "15 customers haven't purchased in 60+ days. Launch a re-engagement campaign with 15% discount code.",
            type: "warning",
            data: {
                atRiskCount: 15,
                lastPurchase: "60+ days ago",
                suggestedAction: "Re-engagement campaign",
            },
        },
        {
            title: "Arif Hasan is Top Sales Rep",
            summary: "Arif Hasan has generated ৳215,000 in revenue this quarter. Consider having him mentor the team.",
            type: "recommendation",
            data: {
                salesRep: "Arif Hasan",
                revenue: 215000,
                salesCount: 52,
            },
        },
    ];

    for (const data of insightsData) {
        await prisma.insight.create({
            data: {
                userId: owner.id,
                companyId: company.id,
                ...data,
            },
        });
    }
    console.log(`✓ Created ${insightsData.length} insights`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n✅ Comprehensive seeding complete!");
    console.log("═══════════════════════════════════════════");
    console.log(`📧 Email: demo@growthmonitor.ai`);
    console.log(`🔑 Password: password123`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`💰 Sales: ${salesData.length} records`);
    console.log(`📢 Campaigns: ${campaignsData.length} with full metrics`);
    console.log(`💡 Insights: ${insightsData.length}`);
    console.log("═══════════════════════════════════════════\n");
};

seedComprehensive()
    .catch((e) => {
        console.error("❌ Seeding error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
