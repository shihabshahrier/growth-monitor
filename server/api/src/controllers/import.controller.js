import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import csvService from '../services/csv.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Configure multer for CSV upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Upload and process CSV file
 * POST /api/import/csv
 */
const importCSV = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'sales' or 'campaigns'
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    if (!type || !['sales', 'campaigns'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid type. Must be "sales" or "campaigns"'
        });
    }

    // Generate job ID
    const jobId = uuidv4();

    // Start background processing
    setImmediate(() => {
        csvService.processImportJob(
            jobId,
            file.path,
            type,
            req.user.id,
            req.user.companyId
        );
    });

    res.status(202).json({
        success: true,
        message: 'CSV import started',
        jobId
    });
});

/**
 * Get import job status
 * GET /api/import/:jobId/status
 */
const getImportStatus = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const status = await csvService.getJobStatus(jobId);

    if (!status) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }

    res.json({
        success: true,
        data: status
    });
});

/**
 * Preview CSV file (first 10 rows)
 * POST /api/import/preview
 */
const previewCSV = asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    try {
        const { data, errors } = await csvService.parseCSV(file.path, 'preview');

        // Clean up file
        const fs = await import('fs');
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        res.json({
            success: true,
            data: {
                preview: data.slice(0, 10),
                totalRows: data.length,
                columns: data.length > 0 ? Object.keys(data[0]) : [],
                parseErrors: errors.slice(0, 5)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default {
    upload,
    importCSV,
    getImportStatus,
    previewCSV
};
