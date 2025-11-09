import { Crown, Shield, User, Eye } from "lucide-react";
import { getRoleConfig } from "@/utils/rbac";

const ROLE_ICONS = {
    OWNER: Crown,
    ADMIN: Shield,
    MEMBER: User,
    VIEWER: Eye,
};

/**
 * Role Badge Component
 * Displays a styled badge for user roles
 */
export function RoleBadge({ role, size = "default", showIcon = true }) {
    const config = getRoleConfig(role);
    const normalizedRole = role?.toUpperCase() || "VIEWER";
    const Icon = ROLE_ICONS[normalizedRole] || Eye;

    const sizeClasses = {
        small: "text-xs px-2 py-0.5 gap-1",
        default: "text-sm px-2.5 py-1 gap-1.5",
        large: "text-base px-3 py-1.5 gap-2",
    };

    const iconSizes = {
        small: "h-3 w-3",
        default: "h-4 w-4",
        large: "h-5 w-5",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
}
