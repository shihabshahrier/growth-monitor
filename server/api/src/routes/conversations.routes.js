import { Router } from "express";
import {
    createConversation,
    getConversations,
    getConversation,
    getMessages,
    addMessage,
    updateConversation,
    deleteConversation
} from "../controllers/conversations.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id", getConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", addMessage);
router.put("/:id", updateConversation);
router.delete("/:id", deleteConversation);

export default router;
