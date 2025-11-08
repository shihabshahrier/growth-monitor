import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create company
  const company = await prisma.company.upsert({
    where: { id: "demo-company-id" },
    update: {},
    create: {
      id: "demo-company-id",
      name: "GrowthMonitor Demo",
      industry: "SaaS",
    },
  });
  console.log("✓ Company created");

  // Create owner user
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
  console.log("✓ Owner user created");

  // Create additional team members
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
  console.log("✓ Team members created");

  // Clear existing data for this company
  await prisma.message.deleteMany({ where: { conversation: { userId: owner.id } } });
  await prisma.conversation.deleteMany({ where: { userId: owner.id } });
  await prisma.sale.deleteMany({ where: { companyId: company.id } });
  await prisma.campaign.deleteMany({ where: { companyId: company.id } });
  await prisma.insight.deleteMany({ where: { companyId: company.id } });
  await prisma.customer.deleteMany({ where: { companyId: company.id } });
  console.log("✓ Cleared existing data");

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Acme Corporation",
        email: "contact@acme.com",
        phone: "+1234567890",
        metadata: { industry: "Technology", size: "Enterprise" },
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Tech Startup Inc",
        email: "hello@techstartup.com",
        phone: "+1234567891",
        metadata: { industry: "SaaS", size: "Small" },
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Global Enterprises",
        email: "sales@global.com",
        phone: "+1234567892",
        metadata: { industry: "Finance", size: "Enterprise" },
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Local Business Co",
        email: "info@localbiz.com",
        phone: "+1234567893",
        metadata: { industry: "Retail", size: "Medium" },
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Digital Agency Pro",
        email: "contact@digitalagency.com",
        phone: "+1234567894",
        metadata: { industry: "Marketing", size: "Small" },
      },
    }),
  ]);
  console.log(`✓ Created ${customers.length} customers`);

  // Create campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        userId: owner.id,
        companyId: company.id,
        name: "Summer Sale 2025",
        platform: "Email",
        startDate: new Date(Date.now() - 30 * 86400000),
        endDate: new Date(Date.now() + 30 * 86400000),
        responses: 450,
        spend: 5000,
      },
    }),
    prisma.campaign.create({
      data: {
        userId: owner.id,
        companyId: company.id,
        name: "Google Ads Q3",
        platform: "Google",
        startDate: new Date(Date.now() - 60 * 86400000),
        endDate: new Date(Date.now() - 30 * 86400000),
        responses: 1200,
        spend: 8000,
      },
    }),
    prisma.campaign.create({
      data: {
        userId: admin.id,
        companyId: company.id,
        name: "LinkedIn B2B Campaign",
        platform: "LinkedIn",
        startDate: new Date(Date.now() - 45 * 86400000),
        endDate: new Date(Date.now() - 15 * 86400000),
        responses: 320,
        spend: 3500,
      },
    }),
    prisma.campaign.create({
      data: {
        userId: owner.id,
        companyId: company.id,
        name: "Social Media Blast",
        platform: "Social",
        startDate: new Date(Date.now() - 15 * 86400000),
        endDate: new Date(Date.now() + 15 * 86400000),
        responses: 890,
        spend: 2000,
      },
    }),
  ]);
  console.log(`✓ Created ${campaigns.length} campaigns`);

  // Create sales with varied data
  const saleData = [];
  const channels = ["Website", "Email", "Social", "Direct", "Google"];
  const products = ["Premium Plan", "Basic Plan", "Enterprise Plan", "Consulting", "Support Package"];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
    const customerIndex = Math.floor(Math.random() * customers.length);
    const amount = Math.floor(Math.random() * 5000) + 500; // $500-$5500

    saleData.push({
      userId: i % 3 === 0 ? owner.id : i % 3 === 1 ? admin.id : member.id,
      companyId: company.id,
      customerId: customers[customerIndex].id,
      date: new Date(Date.now() - daysAgo * 86400000),
      product: products[Math.floor(Math.random() * products.length)],
      amount: amount,
      channel: channels[Math.floor(Math.random() * channels.length)],
    });
  }

  await prisma.sale.createMany({ data: saleData });
  console.log(`✓ Created ${saleData.length} sales`);

  // Create insights
  await prisma.insight.createMany({
    data: [
      {
        userId: owner.id,
        companyId: company.id,
        title: "Revenue Growth Opportunity",
        summary: "Website channel showing 45% higher conversion rate than other channels",
        data: {
          type: "opportunity",
          metrics: {
            websiteConversion: 0.45,
            avgConversion: 0.31,
            potentialRevenue: 25000,
          },
          recommendations: [
            "Increase website marketing budget by 30%",
            "Optimize landing pages for mobile",
            "Implement A/B testing on CTAs",
          ],
        },
      },
      {
        userId: owner.id,
        companyId: company.id,
        title: "Campaign Performance Warning",
        summary: "Social Media Blast campaign underperforming with ROI below 100%",
        data: {
          type: "warning",
          metrics: {
            campaignName: "Social Media Blast",
            spend: 2000,
            revenue: 1500,
            roi: 75,
          },
          recommendations: [
            "Review targeting parameters",
            "Pause low-performing ad sets",
            "Reallocate budget to better performers",
          ],
        },
      },
      {
        userId: admin.id,
        companyId: company.id,
        title: "Customer Retention Trend",
        summary: "Repeat purchase rate increased by 23% in Q3",
        data: {
          type: "trend",
          metrics: {
            q2RepeatRate: 0.34,
            q3RepeatRate: 0.42,
            growth: 0.23,
          },
          topCustomers: ["Acme Corporation", "Global Enterprises", "Tech Startup Inc"],
        },
      },
      {
        userId: owner.id,
        companyId: company.id,
        title: "Seasonal Sales Pattern",
        summary: "Sales peak identified in mid-quarter months - optimize inventory and staffing",
        data: {
          type: "recommendation",
          metrics: {
            janSales: 45000,
            febSales: 67000,
            marSales: 52000,
          },
          recommendations: [
            "Prepare for Feb surge with 50% more inventory",
            "Schedule additional support staff for peak periods",
            "Launch campaigns 2 weeks before peak",
          ],
        },
      },
    ],
  });
  console.log("✓ Created insights");

  // Create conversations with messages
  const conversation = await prisma.conversation.create({
    data: {
      userId: owner.id,
      title: "Revenue Analysis Q3",
      messages: {
        create: [
          {
            userId: owner.id,
            role: "user",
            content: "What are my top performing products this quarter?",
          },
          {
            role: "assistant",
            content: "Based on your sales data, the Premium Plan is your top performer with $125,000 in revenue. The Enterprise Plan follows with $89,000, and the Basic Plan with $56,000. The Premium Plan shows a 34% increase compared to last quarter.",
          },
          {
            userId: owner.id,
            role: "user",
            content: "Which channel brings in the most revenue?",
          },
          {
            role: "assistant",
            content: "The Website channel is your strongest performer, accounting for 42% of total revenue. Direct sales contribute 28%, Email marketing 18%, and Social media 12%. Website channel also has the highest average order value at $2,450.",
          },
        ],
      },
    },
  });
  console.log("✓ Created conversation with messages");

  // Create audit logs for recent activities
  await prisma.auditLog.createMany({
    data: [
      {
        userId: owner.id,
        action: "CREATE",
        entity: "Campaign",
        entityId: campaigns[0].id,
        changes: { name: "Summer Sale 2025", budget: 5000 },
        ipAddress: "192.168.1.100",
      },
      {
        userId: admin.id,
        action: "UPDATE",
        entity: "Customer",
        entityId: customers[0].id,
        changes: { email: "contact@acme.com" },
        ipAddress: "192.168.1.101",
      },
      {
        userId: owner.id,
        action: "LOGIN",
        entity: "User",
        entityId: owner.id,
        ipAddress: "192.168.1.100",
      },
    ],
  });
  console.log("✓ Created audit logs");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - Company: ${company.name}`);
  console.log(`   - Users: 3 (Owner, Admin, Member)`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Sales: ${saleData.length}`);
  console.log(`   - Insights: 4`);
  console.log(`   - Conversations: 1 with 4 messages`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Email: demo@growthmonitor.ai`);
  console.log(`   Password: password123\n`);
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
