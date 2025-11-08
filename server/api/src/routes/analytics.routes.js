import { Router } from "express";
import {
    getOverview,
    getSalesTrend,
    getChannelMix,
    getTopCustomers,
    getCampaignPerformance
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/overview", getOverview);
router.get("/sales-trend", getSalesTrend);
router.get("/channel-mix", getChannelMix);
router.get("/top-customers", getTopCustomers);
router.get("/campaign-performance", getCampaignPerformance);

export default router;
