import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";
import bcrypt from "bcryptjs";

/**
 * Get all team members in the company
 * GET /api/team/members
 */
export const getTeamMembers = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const members = await prisma.user.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        },
        orderBy: { createdAt: 'asc' }
    });

    res.json({
        success: true,
        data: members
    });
});

/**
 * Invite a new team member
 * POST /api/team/invite
 * 
 * Note: This creates a placeholder user account with a temporary password
 * In production, you would send an email with an invitation link
 */
export const inviteTeamMember = asyncHandler(async (req, res) => {
    const { email, name, role = 'MEMBER' } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    if (!email || !name) {
        return res.status(400).json({
            success: false,
            message: "Email and name are required"
        });
    }

    const validRoles = ['ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User with this email already exists"
        });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const newUser = await prisma.user.create({
        data: {
            email,
            name,
            role,
            companyId,
            passwordHash
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    // TODO: Send invitation email with temporary password or magic link
    // For now, return the temp password (ONLY FOR DEVELOPMENT)

    res.status(201).json({
        success: true,
        data: newUser,
        message: "Team member invited successfully",
        // REMOVE THIS IN PRODUCTION - Only for development
        tempPassword: tempPassword
    });
});

/**
 * Update team member role
 * PUT /api/team/:userId/role
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
    }

    // Prevent changing own role
    if (userId === req.user.id) {
        return res.status(400).json({
            success: false,
            message: "You cannot change your own role"
        });
    }

    // Check if target user exists and belongs to same company
    const targetUser = await prisma.user.findFirst({
        where: { id: userId, companyId }
    });

    if (!targetUser) {
        return res.status(404).json({
            success: false,
            message: "Team member not found"
        });
    }

    // Prevent demoting the last owner
    if (targetUser.role === 'OWNER' && role !== 'OWNER') {
        const ownerCount = await prisma.user.count({
            where: { companyId, role: 'OWNER' }
        });

        if (ownerCount <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot demote the last owner. Assign another owner first."
            });
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    res.json({
        success: true,
        data: updatedUser,
        message: "Member role updated successfully"
    });
});

/**
 * Remove team member
 * DELETE /api/team/:userId
 */
export const removeMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Prevent removing self
    if (userId === req.user.id) {
        return res.status(400).json({
            success: false,
            message: "You cannot remove yourself from the team"
        });
    }

    // Check if target user exists and belongs to same company
    const targetUser = await prisma.user.findFirst({
        where: { id: userId, companyId }
    });

    if (!targetUser) {
        return res.status(404).json({
            success: false,
            message: "Team member not found"
        });
    }

    // Prevent removing the last owner
    if (targetUser.role === 'OWNER') {
        const ownerCount = await prisma.user.count({
            where: { companyId, role: 'OWNER' }
        });

        if (ownerCount <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot remove the last owner"
            });
        }
    }

    // Instead of deleting, set companyId to null (or delete if preferred)
    await prisma.user.update({
        where: { id: userId },
        data: { companyId: null }
    });

    res.json({
        success: true,
        message: "Team member removed successfully"
    });
});

/**
 * Get company details
 * GET /api/team/company
 */
export const getCompany = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
            _count: {
                select: {
                    users: true,
                    customers: true,
                    sales: true,
                    campaigns: true
                }
            }
        }
    });

    if (!company) {
        return res.status(404).json({
            success: false,
            message: "Company not found"
        });
    }

    res.json({
        success: true,
        data: company
    });
});

/**
 * Update company details
 * PUT /api/team/company
 */
export const updateCompany = asyncHandler(async (req, res) => {
    const { name, industry } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    const company = await prisma.company.update({
        where: { id: companyId },
        data: {
            ...(name && { name }),
            ...(industry !== undefined && { industry })
        }
    });

    res.json({
        success: true,
        data: company,
        message: "Company updated successfully"
    });
});

/**
 * Reset team member password (Owner only)
 * POST /api/team/:userId/reset-password
 */
export const resetMemberPassword = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const companyId = req.user.companyId;

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: "User must belong to a company"
        });
    }

    // Check if target user exists and belongs to same company
    const targetUser = await prisma.user.findFirst({
        where: { id: userId, companyId }
    });

    if (!targetUser) {
        return res.status(404).json({
            success: false,
            message: "Team member not found"
        });
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    });

    res.json({
        success: true,
        message: "Password reset successfully",
        tempPassword: tempPassword
    });
});
