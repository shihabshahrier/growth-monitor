// Role-based access control utilities

/**
 * User roles in the system
 */
export const ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    VIEWER: 'VIEWER',
};

/**
 * Role display configuration
 */
export const ROLE_CONFIG = {
    OWNER: {
        label: 'Owner',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-300',
        description: 'Full access to all features and settings',
    },
    ADMIN: {
        label: 'Admin',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        borderColor: 'border-blue-300',
        description: 'Manage team members and data',
    },
    MEMBER: {
        label: 'Member',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        borderColor: 'border-green-300',
        description: 'View and manage data',
    },
    VIEWER: {
        label: 'Viewer',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        borderColor: 'border-gray-300',
        description: 'Read-only access',
    },
};

/**
 * Check if user has a specific role
 * @param {object} user - User object with role property
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
    if (!user?.role) return false;
    const userRole = user.role.toUpperCase();
    const allowedRoles = Array.isArray(roles)
        ? roles.map(r => r.toUpperCase())
        : [roles.toUpperCase()];
    return allowedRoles.includes(userRole);
};

/**
 * Check if user is owner
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export const isOwner = (user) => hasRole(user, ROLES.OWNER);

/**
 * Check if user is admin or owner
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export const isAdminOrOwner = (user) => hasRole(user, [ROLES.OWNER, ROLES.ADMIN]);

/**
 * Check if user can manage data (not viewer)
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export const canManageData = (user) => hasRole(user, [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);

/**
 * Get role display config
 * @param {string} role - User role
 * @returns {object}
 */
export const getRoleConfig = (role) => {
    const normalizedRole = role?.toUpperCase() || ROLES.VIEWER;
    return ROLE_CONFIG[normalizedRole] || ROLE_CONFIG[ROLES.VIEWER];
};

/**
 * Get role label for display
 * @param {string} role - User role
 * @returns {string}
 */
export const getRoleLabel = (role) => {
    return getRoleConfig(role).label;
};
