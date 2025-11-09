import { Router } from "express";
import {
    uploadSalesCSV,
    getSalesCSVTemplate,
    uploadCampaignsCSV,
    getCampaignsCSVTemplate
} from "../controllers/csv.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sales CSV routes
router.post("/sales/upload", requireRole(['OWNER', 'ADMIN', 'MEMBER']), uploadSalesCSV);
router.get("/sales/template", requireRole(['OWNER', 'ADMIN', 'MEMBER']), getSalesCSVTemplate);

// Campaigns CSV routes
router.post("/campaigns/upload", requireRole(['OWNER', 'ADMIN', 'MEMBER']), uploadCampaignsCSV);
router.get("/campaigns/template", requireRole(['OWNER', 'ADMIN', 'MEMBER']), getCampaignsCSVTemplate);

export default router;
