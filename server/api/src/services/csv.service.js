import fs from 'fs';
import Papa from 'papaparse';
import { prisma } from './prisma.service.js';
import { redis } from './redis.service.js';

/**
 * Parse CSV file and validate columns
 * @param {string} filePath - Path to CSV file
 * @param {string} type - 'sales' or 'campaigns'
 * @returns {Promise<{data: Array, errors: Array}>}
 */
async function parseCSV(filePath, type) {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];

        const stream = fs.createReadStream(filePath);

        Papa.parse(stream, {
            header: true,
            skipEmptyLines: true,
            step: (result, parser) => {
                if (result.errors.length > 0) {
                    errors.push({ row: results.length + 1, errors: result.errors });
                } else {
                    results.push(result.data);
                }
            },
            complete: () => {
                resolve({ data: results, errors });
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

/**
 * Validate sales CSV data
 * @param {Array} data - Array of sales objects
 * @returns {Array} - Array of validation errors
 */
function validateSalesData(data) {
    const errors = [];
    const requiredColumns = ['date', 'product', 'amount', 'channel'];

    data.forEach((row, index) => {
        const missing = requiredColumns.filter(col => !row[col]);
        if (missing.length > 0) {
            errors.push({
                row: index + 1,
                message: `Missing required columns: ${missing.join(', ')}`
            });
        }

        // Validate date format
        if (row.date && isNaN(Date.parse(row.date))) {
            errors.push({
                row: index + 1,
                message: `Invalid date format: ${row.date}`
            });
        }

        // Validate amount is numeric
        if (row.amount && isNaN(parseFloat(row.amount))) {
            errors.push({
                row: index + 1,
                message: `Invalid amount: ${row.amount}`
            });
        }
    });

    return errors;
}

/**
 * Validate campaigns CSV data
 * @param {Array} data - Array of campaign objects
 * @returns {Array} - Array of validation errors
 */
function validateCampaignsData(data) {
    const errors = [];
    const requiredColumns = ['name', 'platform', 'startDate', 'spend'];

    data.forEach((row, index) => {
        const missing = requiredColumns.filter(col => !row[col]);
        if (missing.length > 0) {
            errors.push({
                row: index + 1,
                message: `Missing required columns: ${missing.join(', ')}`
            });
        }

        // Validate dates
        if (row.startDate && isNaN(Date.parse(row.startDate))) {
            errors.push({
                row: index + 1,
                message: `Invalid startDate format: ${row.startDate}`
            });
        }

        if (row.endDate && isNaN(Date.parse(row.endDate))) {
            errors.push({
                row: index + 1,
                message: `Invalid endDate format: ${row.endDate}`
            });
        }

        // Validate numeric fields
        if (row.spend && isNaN(parseFloat(row.spend))) {
            errors.push({
                row: index + 1,
                message: `Invalid spend amount: ${row.spend}`
            });
        }

        if (row.responses && isNaN(parseInt(row.responses))) {
            errors.push({
                row: index + 1,
                message: `Invalid responses count: ${row.responses}`
            });
        }
    });

    return errors;
}

/**
 * Bulk import sales data
 * @param {Array} data - Array of sales objects
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @returns {Promise<{success: number, failed: number}>}
 */
async function importSales(data, userId, companyId) {
    const salesData = data.map(row => ({
        userId,
        companyId: companyId || null,
        date: new Date(row.date),
        product: row.product,
        amount: parseFloat(row.amount),
        channel: row.channel,
        customerId: row.customerId || null
    }));

    try {
        const result = await prisma.sale.createMany({
            data: salesData,
            skipDuplicates: true
        });

        return {
            success: result.count,
            failed: data.length - result.count
        };
    } catch (error) {
        console.error('Error importing sales:', error);
        throw error;
    }
}

/**
 * Bulk import campaigns data
 * @param {Array} data - Array of campaign objects
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @returns {Promise<{success: number, failed: number}>}
 */
async function importCampaigns(data, userId, companyId) {
    const campaignsData = data.map(row => ({
        userId,
        companyId: companyId || null,
        name: row.name,
        platform: row.platform,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        responses: row.responses ? parseInt(row.responses) : 0,
        spend: parseFloat(row.spend)
    }));

    try {
        const result = await prisma.campaign.createMany({
            data: campaignsData,
            skipDuplicates: true
        });

        return {
            success: result.count,
            failed: data.length - result.count
        };
    } catch (error) {
        console.error('Error importing campaigns:', error);
        throw error;
    }
}

/**
 * Process CSV import job
 * @param {string} jobId - Job ID
 * @param {string} filePath - Path to CSV file
 * @param {string} type - 'sales' or 'campaigns'
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 */
async function processImportJob(jobId, filePath, type, userId, companyId) {
    try {
        // Update job status to processing
        await redis.set(`import_job:${jobId}`, JSON.stringify({
            status: 'processing',
            progress: 0
        }), 'EX', 3600);

        // Parse CSV
        const { data, errors: parseErrors } = await parseCSV(filePath, type);

        if (parseErrors.length > 0) {
            await redis.set(`import_job:${jobId}`, JSON.stringify({
                status: 'failed',
                errors: parseErrors
            }), 'EX', 3600);
            return;
        }

        // Validate data
        const validationErrors = type === 'sales'
            ? validateSalesData(data)
            : validateCampaignsData(data);

        if (validationErrors.length > 0) {
            await redis.set(`import_job:${jobId}`, JSON.stringify({
                status: 'failed',
                errors: validationErrors
            }), 'EX', 3600);
            return;
        }

        // Import data
        const result = type === 'sales'
            ? await importSales(data, userId, companyId)
            : await importCampaigns(data, userId, companyId);

        // Update job status to completed
        await redis.set(`import_job:${jobId}`, JSON.stringify({
            status: 'completed',
            result: {
                total: data.length,
                ...result
            }
        }), 'EX', 3600);

        // Clean up temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

    } catch (error) {
        console.error(`Import job ${jobId} failed:`, error);
        await redis.set(`import_job:${jobId}`, JSON.stringify({
            status: 'failed',
            error: error.message
        }), 'EX', 3600);
    }
}

/**
 * Get import job status
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>}
 */
async function getJobStatus(jobId) {
    const status = await redis.get(`import_job:${jobId}`);
    if (!status) {
        return null;
    }
    return JSON.parse(status);
}

export default {
    parseCSV,
    validateSalesData,
    validateCampaignsData,
    importSales,
    importCampaigns,
    processImportJob,
    getJobStatus
};
