import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import authRoutes from "./auth.routes.js";
import campaignsRoutes from "./campaigns.routes.js";
import insightsRoutes from "./insights.routes.js";
import salesRoutes from "./sales.routes.js";
import uploadRoutes from "./upload.routes.js";
import importRoutes from "./import.routes.js";
import customersRoutes from "./customers.routes.js";
import conversationsRoutes from "./conversations.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import teamRoutes from "./team.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/sales", salesRoutes);
router.use("/campaigns", campaignsRoutes);
router.use("/insights", insightsRoutes);
router.use("/ai", aiRoutes);
router.use("/upload", uploadRoutes);
router.use("/import", importRoutes);
router.use("/customers", customersRoutes);
router.use("/conversations", conversationsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/team", teamRoutes);

export default router;
