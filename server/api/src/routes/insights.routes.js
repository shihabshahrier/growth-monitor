import { Router } from "express";
import {
  createInsight,
  deleteInsight,
  listInsights,
} from "../controllers/insights.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listInsights);
router.post("/", createInsight);
router.delete("/:insightId", deleteInsight);

export default router;
