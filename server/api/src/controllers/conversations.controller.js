import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../services/prisma.service.js";

/**
 * Create a new conversation
 * POST /api/conversations
 */
export const createConversation = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const userId = req.user.id;

    const conversation = await prisma.conversation.create({
        data: {
            userId,
            title: title || "New Conversation"
        }
    });

    res.status(201).json({
        success: true,
        data: conversation
    });
});

/**
 * Get all conversations for the current user
 * GET /api/conversations
 */
export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: parseInt(limit),
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                    content: true,
                    createdAt: true
                }
            },
            _count: {
                select: { messages: true }
            }
        }
    });

    res.json({
        success: true,
        data: conversations
    });
});

/**
 * Get a single conversation with messages
 * GET /api/conversations/:id
 */
export const getConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found"
        });
    }

    res.json({
        success: true,
        data: conversation
    });
});

/**
 * Get messages for a conversation
 * GET /api/conversations/:id/messages
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query;

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
        where: { id, userId }
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found"
        });
    }

    const messages = await prisma.message.findMany({
        where: {
            conversationId: id,
            ...(before && { createdAt: { lt: new Date(before) } })
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
    });

    res.json({
        success: true,
        data: messages.reverse() // Return in chronological order
    });
});

/**
 * Add a message to a conversation
 * POST /api/conversations/:id/messages
 */
export const addMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, content } = req.body;
    const userId = req.user.id;

    if (!role || !content) {
        return res.status(400).json({
            success: false,
            message: "Role and content are required"
        });
    }

    if (!['user', 'assistant'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be 'user' or 'assistant'"
        });
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
        where: { id, userId }
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found"
        });
    }

    const message = await prisma.message.create({
        data: {
            conversationId: id,
            userId: role === 'user' ? userId : null,
            role,
            content
        }
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() }
    });

    res.status(201).json({
        success: true,
        data: message
    });
});

/**
 * Update conversation title
 * PUT /api/conversations/:id
 */
export const updateConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    // Verify conversation belongs to user
    const existingConversation = await prisma.conversation.findFirst({
        where: { id, userId }
    });

    if (!existingConversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found"
        });
    }

    const conversation = await prisma.conversation.update({
        where: { id },
        data: { title }
    });

    res.json({
        success: true,
        data: conversation
    });
});

/**
 * Delete a conversation
 * DELETE /api/conversations/:id
 */
export const deleteConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
        where: { id, userId }
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found"
        });
    }

    // Delete conversation (messages will be deleted via Cascade)
    await prisma.conversation.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: "Conversation deleted successfully"
    });
});
