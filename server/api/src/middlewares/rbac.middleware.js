/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Permission Matrix:
 * - OWNER: Full access to all resources and team management
 * - ADMIN: Can manage all data except team settings
 * - MEMBER: Can view and create data, limited edit/delete
 * - VIEWER: Read-only access
 */

const PERMISSIONS = {
    // Sales permissions
    'sales:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    'sales:create': ['OWNER', 'ADMIN', 'MEMBER'],
    'sales:update': ['OWNER', 'ADMIN', 'MEMBER'],
    'sales:delete': ['OWNER', 'ADMIN'],

    // Campaign permissions
    'campaigns:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    'campaigns:create': ['OWNER', 'ADMIN', 'MEMBER'],
    'campaigns:update': ['OWNER', 'ADMIN', 'MEMBER'],
    'campaigns:delete': ['OWNER', 'ADMIN'],

    // Insight permissions
    'insights:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    'insights:create': ['OWNER', 'ADMIN', 'MEMBER'],
    'insights:update': ['OWNER', 'ADMIN', 'MEMBER'],
    'insights:delete': ['OWNER', 'ADMIN'],

    // Customer permissions
    'customers:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    'customers:create': ['OWNER', 'ADMIN', 'MEMBER'],
    'customers:update': ['OWNER', 'ADMIN', 'MEMBER'],
    'customers:delete': ['OWNER', 'ADMIN'],

    // Analytics permissions
    'analytics:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],

    // AI permissions
    'ai:query': ['OWNER', 'ADMIN', 'MEMBER'],

    // Import permissions
    'import:csv': ['OWNER', 'ADMIN'],

    // Team management permissions
    'team:read': ['OWNER', 'ADMIN'],
    'team:invite': ['OWNER', 'ADMIN'],
    'team:update': ['OWNER'],
    'team:delete': ['OWNER'],

    // File upload permissions
    'upload:file': ['OWNER', 'ADMIN', 'MEMBER']
};

/**
 * Check if user has required permission
 * @param {string} permission - Permission to check (e.g., 'sales:create')
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const allowedRoles = PERMISSIONS[permission];

        if (!allowedRoles) {
            console.error(`Unknown permission: ${permission}`);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Insufficient permissions. Required: ${permission}`
            });
        }

        next();
    };
};

/**
 * Check if user has one of the required roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Check if user owns the resource or has admin privileges
 * Expects resourceUserId to be set in req by previous middleware
 */
export const requireOwnershipOrAdmin = (req, res, next) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const resourceUserId = req.resourceUserId;

    if (!userRole || !userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // OWNER and ADMIN can access any resource in their company
    if (['OWNER', 'ADMIN'].includes(userRole)) {
        return next();
    }

    // Others can only access their own resources
    if (resourceUserId && resourceUserId === userId) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
    });
};

export default {
    requirePermission,
    requireRole,
    requireOwnershipOrAdmin,
    PERMISSIONS
};
