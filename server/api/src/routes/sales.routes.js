import { Router } from "express";
import {
  createSale,
  deleteSale,
  getSale,
  listSales,
  updateSale,
} from "../controllers/sales.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listSales);
router.post("/", createSale);
router.get("/:saleId", getSale);
router.put("/:saleId", updateSale);
router.delete("/:saleId", deleteSale);

export default router;
