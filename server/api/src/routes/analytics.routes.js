import { Router } from "express";
import {
    getOverview,
    getSalesTrend,
    getCustomerInsights,
    getCampaignAnalytics,
    getAIInsights,
    clearCache
} from "../controllers/analytics-enhanced.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Main analytics endpoints
router.get("/overview", getOverview);
router.get("/sales-trend", getSalesTrend);
router.get("/customer-insights", getCustomerInsights);
router.get("/campaign-analytics", getCampaignAnalytics);
router.get("/ai-insights", getAIInsights);

// Cache management
router.delete("/cache", clearCache);

export default router;
