import { Router } from 'express';
import importController from '../controllers/import.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Preview CSV file
router.post('/preview', importController.upload.single('file'), importController.previewCSV);

// Import CSV file
router.post('/csv', importController.upload.single('file'), importController.importCSV);

// Get import job status
router.get('/:jobId/status', importController.getImportStatus);

export default router;
