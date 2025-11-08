import { Router } from "express";
import {
    getTeamMembers,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
    getCompany,
    updateCompany,
    resetMemberPassword
} from "../controllers/team.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team member management
router.get("/members", requireRole(['OWNER', 'ADMIN']), getTeamMembers);
router.post("/invite", requireRole(['OWNER', 'ADMIN']), inviteTeamMember);
router.put("/:userId/role", requireRole(['OWNER']), updateMemberRole);
router.post("/:userId/reset-password", requireRole(['OWNER']), resetMemberPassword);
router.delete("/:userId", requireRole(['OWNER']), removeMember);

// Company management
router.get("/company", getCompany);
router.put("/company", requireRole(['OWNER']), updateCompany);

export default router;
