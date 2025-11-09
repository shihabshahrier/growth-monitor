import { Router } from "express";
import {
  createInsight,
  deleteInsight,
  listInsights,
  getInsight,
  markAsRead,
  generateInsights,
} from "../controllers/insights.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listInsights);
router.post("/", createInsight);
router.post("/generate", generateInsights);
router.get("/:insightId", getInsight);
router.put("/:insightId/read", markAsRead);
router.delete("/:insightId", deleteInsight);

export default router;
