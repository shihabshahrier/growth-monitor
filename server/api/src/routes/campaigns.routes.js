import { Router } from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from "../controllers/campaigns.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listCampaigns);
router.get("/:campaignId", getCampaign);
router.post("/", createCampaign);
router.put("/:campaignId", updateCampaign);
router.delete("/:campaignId", deleteCampaign);

export default router;
