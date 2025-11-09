import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";
import Papa from "papaparse";

/**
 * CSV Template for Sales:
 * date,order_id,customer_name,customer_email,customer_phone,product_name,category,region,sales_channel,quantity,unit_price,total_amount,payment_method,sales_rep,remarks
 * 
 * Required: date,order_id,product_name,category,region,sales_channel,quantity,unit_price,total_amount
 * Optional but recommended: customer_email,customer_phone,payment_method,sales_rep,remarks
 * 
 * Example:
 * 2025-10-31,ORD-9042,Sadia Ahmed,sadia@gmail.com,017xxxxxxxx,Women's Kurti,Apparel,Dhaka,Facebook,3,1200,3600,bKash,Arif Hasan,10% discount applied
 */

/**
 * Upload Sales CSV
 * POST /api/sales/upload-csv
 */
export const uploadSalesCSV = asyncHandler(async (req, res) => {
    const { csvData } = req.body;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    if (!csvData) {
        return res.status(400).json({
            success: false,
            message: "CSV data is required"
        });
    }

    try {
        // Parse CSV
        const parseResult = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            transform: (value) => value.trim()
        });

        if (parseResult.errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "CSV parsing errors",
                errors: parseResult.errors
            });
        }

        const records = parseResult.data;

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        const results = {
            total: records.length,
            created: 0,
            failed: 0,
            errors: []
        };

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            try {
                // Validate required fields
                const requiredFields = ['date', 'order_id', 'product_name', 'category', 'region', 'sales_channel', 'quantity', 'unit_price', 'total_amount'];
                const missingFields = requiredFields.filter(field => !record[field]);

                if (missingFields.length > 0) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2, // +2 because of header and 0-indexing
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    continue;
                }

                // Parse date (support multiple formats)
                let saleDate;
                if (record.date.includes('/')) {
                    // Handle DD/MM/YYYY format
                    const [day, month, year] = record.date.split('/');
                    saleDate = new Date(`${year}-${month}-${day}`);
                } else {
                    // Handle ISO format
                    saleDate = new Date(record.date);
                }

                if (isNaN(saleDate.getTime())) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY"
                    });
                    continue;
                }

                // Parse numeric values
                const quantity = parseInt(record.quantity);
                const unitPrice = parseFloat(record.unit_price);
                const totalAmount = parseFloat(record.total_amount);

                if (isNaN(quantity) || isNaN(unitPrice) || isNaN(totalAmount)) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: "Invalid numeric values for quantity, unit_price, or total_amount"
                    });
                    continue;
                }

                // Validate total_amount calculation (with small tolerance for floating point)
                const calculatedTotal = quantity * unitPrice;
                if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: `Total amount mismatch: ${quantity} × ${unitPrice} = ${calculatedTotal}, but got ${totalAmount}`
                    });
                    continue;
                }

                let customerId = null;

                // If customer information is provided, create or find customer
                if (record.customer_name || record.customer_email || record.customer_phone) {
                    const customerData = {
                        name: record.customer_name || "Unknown Customer",
                        email: record.customer_email?.trim() || null,
                        phone: record.customer_phone?.trim() || null,
                        companyId,
                        metadata: {
                            region: record.region,
                            last_order_id: record.order_id,
                            last_purchase_date: record.date,
                            payment_method: record.payment_method || null
                        }
                    };

                    // Try to find existing customer by email or phone
                    let customer = null;
                    if (customerData.email) {
                        customer = await prisma.customer.findFirst({
                            where: {
                                companyId,
                                email: customerData.email
                            }
                        });
                    }

                    if (!customer && customerData.phone) {
                        customer = await prisma.customer.findFirst({
                            where: {
                                companyId,
                                phone: customerData.phone
                            }
                        });
                    }

                    // Create or update customer
                    if (customer) {
                        // Update existing customer with latest info
                        const existingMetadata = customer.metadata || {};
                        customer = await prisma.customer.update({
                            where: { id: customer.id },
                            data: {
                                name: customerData.name,
                                metadata: {
                                    ...existingMetadata,
                                    ...customerData.metadata
                                }
                            }
                        });
                        customerId = customer.id;
                    } else {
                        // Create new customer
                        customer = await prisma.customer.create({
                            data: customerData
                        });
                        customerId = customer.id;
                    }
                }

                // Create sale with all comprehensive fields
                await prisma.sale.create({
                    data: {
                        userId,
                        companyId,
                        customerId,
                        date: saleDate,
                        product: record.product_name.trim(),
                        amount: totalAmount,
                        channel: record.sales_channel.trim(),
                        orderId: record.order_id?.trim() || null,
                        category: record.category?.trim() || null,
                        region: record.region?.trim() || null,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        paymentMethod: record.payment_method?.trim() || null,
                        salesRep: record.sales_rep?.trim() || null,
                        remarks: record.remarks?.trim() || null
                    }
                });

                results.created++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    message: error.message
                });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Successfully imported ${results.created} of ${results.total} sales`
        });

    } catch (error) {
        console.error("CSV parsing error:", error);
        res.status(400).json({
            success: false,
            message: "Failed to parse CSV file. Please check the format.",
            error: error.message
        });
    }
});

/**
 * Get Sales CSV Template
 * GET /api/sales/csv-template
 */
export const getSalesCSVTemplate = asyncHandler(async (req, res) => {
    const template = `date,order_id,customer_name,customer_email,customer_phone,product_name,category,region,sales_channel,quantity,unit_price,total_amount,payment_method,sales_rep,remarks
2025-10-31,ORD-9042,Sadia Ahmed,sadia@gmail.com,01712345678,Women's Kurti,Apparel,Dhaka,Facebook,3,1200,3600,bKash,Arif Hasan,10% discount applied
2025-11-01,ORD-9043,Rakib Khan,rakib@example.com,01987654321,Men's Shirt,Apparel,Chattogram,WhatsApp,2,800,1600,Nagad,Fatema Begum,
2025-11-02,ORD-9044,Tasnim Akter,tasnim@gmail.com,01555666777,Handmade Bag,Accessories,Dhaka,In-store,1,2500,2500,Cash,Arif Hasan,VIP customer
2025-11-03,ORD-9045,Imran Hossain,imran@example.com,,Notebook Set,Stationery,Sylhet,Facebook,5,150,750,bKash,Sadia Ahmed,Bulk order`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_data_template.csv"');
    res.send(template);
});

/**
 * CSV Template for Campaigns:
 * campaign_name,start_date,end_date,channel,region,budget,impressions,clicks,leads_generated,conversions,revenue_generated,sales_rep,status,remarks
 * 
 * Required: campaign_name,start_date,end_date,channel,budget,status
 * Optional: region,impressions,clicks,leads_generated,conversions,revenue_generated,sales_rep,remarks
 * 
 * Example:
 * Eid Mega Sale,2025-03-15,2025-03-30,Facebook,Dhaka,25000,120000,2500,150,45,72000,Sadia Ahmed,Completed,Retargeted from Eid 2024 list
 */

/**
 * Upload Campaigns CSV
 * POST /api/campaigns/upload-csv
 */
export const uploadCampaignsCSV = asyncHandler(async (req, res) => {
    const { csvData } = req.body;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    if (!csvData) {
        return res.status(400).json({
            success: false,
            message: "CSV data is required"
        });
    }

    try {
        // Parse CSV
        const parseResult = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            transform: (value) => value.trim()
        });

        if (parseResult.errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "CSV parsing errors",
                errors: parseResult.errors
            });
        }

        const records = parseResult.data;

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        const results = {
            total: records.length,
            created: 0,
            failed: 0,
            errors: []
        };

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            try {
                // Validate required fields
                const requiredFields = ['campaign_name', 'start_date', 'end_date', 'channel', 'budget', 'status'];
                const missingFields = requiredFields.filter(field => !record[field]);

                if (missingFields.length > 0) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    continue;
                }

                // Parse dates (support multiple formats)
                let startDate;
                if (record.start_date.includes('/')) {
                    const [day, month, year] = record.start_date.split('/');
                    startDate = new Date(`${year}-${month}-${day}`);
                } else {
                    startDate = new Date(record.start_date);
                }

                if (isNaN(startDate.getTime())) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: "Invalid start_date format. Use YYYY-MM-DD or DD/MM/YYYY"
                    });
                    continue;
                }

                let endDate = null;
                if (record.end_date) {
                    if (record.end_date.includes('/')) {
                        const [day, month, year] = record.end_date.split('/');
                        endDate = new Date(`${year}-${month}-${day}`);
                    } else {
                        endDate = new Date(record.end_date);
                    }

                    if (isNaN(endDate.getTime())) {
                        results.failed++;
                        results.errors.push({
                            row: i + 2,
                            message: "Invalid end_date format. Use YYYY-MM-DD or DD/MM/YYYY"
                        });
                        continue;
                    }

                    // Validate end_date is after start_date
                    if (endDate < startDate) {
                        results.failed++;
                        results.errors.push({
                            row: i + 2,
                            message: "end_date must be after start_date"
                        });
                        continue;
                    }
                }

                // Validate status
                const validStatuses = ['Active', 'Completed', 'Paused'];
                if (!validStatuses.includes(record.status)) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    });
                    continue;
                }

                // Parse numeric values
                const budget = parseFloat(record.budget);
                const impressions = record.impressions ? parseInt(record.impressions) : 0;
                const clicks = record.clicks ? parseInt(record.clicks) : 0;
                const leadsGenerated = record.leads_generated ? parseInt(record.leads_generated) : 0;
                const conversions = record.conversions ? parseInt(record.conversions) : 0;
                const revenueGenerated = record.revenue_generated ? parseFloat(record.revenue_generated) : 0;

                if (isNaN(budget)) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: "Invalid budget value"
                    });
                    continue;
                }

                if (isNaN(impressions) || isNaN(clicks) || isNaN(leadsGenerated) || isNaN(conversions) || isNaN(revenueGenerated)) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: "Invalid numeric values for impressions, clicks, leads, conversions, or revenue"
                    });
                    continue;
                }

                // Create campaign with all comprehensive fields
                await prisma.campaign.create({
                    data: {
                        userId,
                        companyId,
                        name: record.campaign_name.trim(),
                        platform: record.channel.trim(),
                        region: record.region?.trim() || null,
                        startDate,
                        endDate,
                        spend: budget,
                        impressions: impressions || null,
                        clicks: clicks || null,
                        responses: leadsGenerated, // Using leads_generated as responses
                        conversions: conversions || null,
                        revenueGenerated: revenueGenerated || null,
                        salesRep: record.campaign_manager?.trim() || null,
                        status: record.status,
                        remarks: record.remarks?.trim() || null
                    }
                });

                results.created++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    message: error.message
                });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Successfully imported ${results.created} of ${results.total} campaigns`
        });

    } catch (error) {
        console.error("CSV parsing error:", error);
        res.status(400).json({
            success: false,
            message: "Failed to parse CSV file. Please check the format.",
            error: error.message
        });
    }
});

/**
 * Get Campaigns CSV Template
 * GET /api/campaigns/csv-template
 */
export const getCampaignsCSVTemplate = asyncHandler(async (req, res) => {
    const template = `campaign_name,start_date,end_date,channel,region,budget,impressions,clicks,leads_generated,conversions,revenue_generated,campaign_manager,status,remarks
Eid Mega Sale,2025-03-15,2025-03-30,Facebook,Dhaka,25000,120000,2500,150,45,72000,Sadia Ahmed,Completed,Retargeted from Eid 2024 list
Winter Collection Launch,2025-12-01,2025-12-15,Instagram,Chattogram,15000,85000,1800,95,30,48000,Arif Hasan,Completed,High engagement rate
New Year Flash Sale,2025-12-28,2026-01-05,WhatsApp,Dhaka,8000,25000,950,78,25,32500,Fatema Begum,Active,Direct messaging campaign
Valentine's Day Promo,2026-02-10,2026-02-14,Email,Nationwide,5000,45000,1200,120,38,41000,Sadia Ahmed,Paused,Email list 15k subscribers`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campaign_data_template.csv"');
    res.send(template);
});
