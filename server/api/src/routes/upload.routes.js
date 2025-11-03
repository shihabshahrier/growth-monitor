import { Router } from "express";
import { uploadFile } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", authenticate, upload.single("file"), uploadFile);

export default router;
