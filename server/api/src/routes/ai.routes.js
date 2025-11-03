import { Router } from "express";
import {
  enqueueQuery,
  getResult,
  streamResult,
} from "../controllers/ai.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/query", authenticate, enqueueQuery);
router.get("/stream/:jobId", authenticate, streamResult);
router.get("/result/:jobId", authenticate, getResult);

export default router;
