import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Users,
    UserPlus,
    Crown,
    Shield,
    User,
    Mail,
    MoreVertical,
    Trash2,
    Settings as SettingsIcon,
    Key,
    Copy,
    Eye,
    EyeOff,
    X,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_CONFIG = {
    owner: {
        label: "Owner",
        icon: Crown,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        description: "Full access to all features and settings",
    },
    admin: {
        label: "Admin",
        icon: Shield,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        description: "Manage team members and data",
    },
    member: {
        label: "Member",
        icon: User,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
        description: "View and manage data",
    },
};

export const TeamPage = () => {
    const navigate = useNavigate();
    const { apiFetch, user: currentUser } = useAuth();
    const [company, setCompany] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMenuOpen, setActionMenuOpen] = useState(null);
    const [passwordModal, setPasswordModal] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    const loadTeam = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/team/company");
            setCompany(data.company);
        } catch (error) {
            console.error("Error loading team:", error);
            toast.error("Failed to load team information");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadMembers = useCallback(async () => {
        try {
            const data = await apiFetch("/team/members");
            // Backend returns {success: true, data: [...]}
            setMembers(data.data || data.members || []);
        } catch (error) {
            console.error("Error loading members:", error);
            toast.error("Failed to load team members");
        }
    }, [apiFetch]);

    useEffect(() => {
        loadTeam();
        loadMembers();
    }, [loadTeam, loadMembers]);

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await apiFetch(`/team/${memberId}/role`, {
                method: "PUT",
                body: JSON.stringify({ role: newRole }),
            });

            toast.success("Role updated successfully");
            loadMembers();
            setActionMenuOpen(null);
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm("Are you sure you want to remove this team member?")) {
            return;
        }

        try {
            await apiFetch(`/team/${memberId}`, {
                method: "DELETE",
            });

            toast.success("Member removed successfully");
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            setActionMenuOpen(null);
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Failed to remove member");
        }
    };

    const handleResetPassword = async (memberId, memberName) => {
        try {
            setResettingPassword(true);
            const response = await apiFetch(`/team/${memberId}/reset-password`, {
                method: "POST",
            });

            setPasswordModal({
                memberName,
                password: response.tempPassword,
            });
            setShowPassword(false);
            setActionMenuOpen(null);
            toast.success("Password reset successfully");
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("Failed to reset password");
        } finally {
            setResettingPassword(false);
        }
    };

    const copyPassword = () => {
        if (passwordModal?.password) {
            navigator.clipboard.writeText(passwordModal.password);
            toast.success("Password copied to clipboard!");
        }
    };

    const isOwner = () => {
        return currentUser?.role === "OWNER" || currentUser?.role === "owner";
    };

    const getRoleIcon = (role) => {
        const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
        const Icon = config.icon;
        return <Icon className={`h-4 w-4 ${config.color}`} />;
    };

    const getRoleBadge = (role) => {
        const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}
            >
                {getRoleIcon(role)}
                {config.label}
            </span>
        );
    };

    const canManageMembers = () => {
        return currentUser?.role === "OWNER" || currentUser?.role === "owner" ||
            currentUser?.role === "ADMIN" || currentUser?.role === "admin";
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading team...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Team</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your team members and permissions
                    </p>
                </div>
                <div className="flex gap-2">
                    {canManageMembers() && (
                        <Button onClick={() => navigate("/team/invite")}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Member
                        </Button>
                    )}
                    {(currentUser?.role === "OWNER" || currentUser?.role === "owner") && (
                        <Button variant="outline" onClick={() => navigate("/company-settings")}>
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Company Settings
                        </Button>
                    )}
                </div>
            </div>

            {/* Company Info */}
            {company && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold">{company.name}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {members.length} team {members.length === 1 ? "member" : "members"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Role Legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                            const Icon = config.icon;
                            return (
                                <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                                    <div className={`p-2 rounded ${config.bgColor}`}>
                                        <Icon className={`h-5 w-5 ${config.color}`} />
                                    </div>
                                    <div>
                                        <p className="font-medium">{config.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {config.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {isOwner() && (
                        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-start gap-3">
                                <Key className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-blue-500 mb-1">
                                        Password Management
                                    </p>
                                    <p className="text-muted-foreground">
                                        As an owner, you can reset passwords for any team member. Click the menu (⋮) next to a member to reset their password and generate a new temporary password.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members ({members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <Users className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Invite team members to collaborate on your business data and insights.
                            </p>
                            {canManageMembers() && (
                                <Button onClick={() => navigate("/team/invite")}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite Your First Member
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold">
                                            {member.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-medium">{member.name}</h3>
                                                {member.id === currentUser?.id && (
                                                    <span className="text-xs text-muted-foreground">(You)</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {member.email}
                                            </div>
                                        </div>
                                        <div>{getRoleBadge(member.role)}</div>
                                    </div>

                                    {canManageMembers() && member.id !== currentUser?.id && (
                                        <div className="relative ml-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setActionMenuOpen(
                                                        actionMenuOpen === member.id ? null : member.id
                                                    )
                                                }
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>

                                            {actionMenuOpen === member.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-10">
                                                    <div className="py-1">
                                                        {isOwner() && (
                                                            <>
                                                                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                                                                    Change Role
                                                                </div>
                                                                {Object.entries(ROLE_CONFIG)
                                                                    .filter(([role]) => role !== member.role)
                                                                    .map(([role, config]) => (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => handleUpdateRole(member.id, role)}
                                                                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                                                        >
                                                                            {getRoleIcon(role)}
                                                                            {config.label}
                                                                        </button>
                                                                    ))}
                                                                <div className="border-t my-1"></div>
                                                            </>
                                                        )}
                                                        {isOwner() && (
                                                            <button
                                                                onClick={() => handleResetPassword(member.id, member.name)}
                                                                disabled={resettingPassword}
                                                                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-blue-600"
                                                            >
                                                                <Key className="h-4 w-4" />
                                                                Reset Password
                                                            </button>
                                                        )}
                                                        {isOwner() && <div className="border-t my-1"></div>}
                                                        {isOwner() && (
                                                            <button
                                                                onClick={() => handleRemoveMember(member.id)}
                                                                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Remove Member
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password Modal */}
            {passwordModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Key className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle>Password Reset</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {passwordModal.memberName}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPasswordModal(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-500 mb-1">
                                            Temporary Password Generated
                                        </p>
                                        <p className="text-muted-foreground">
                                            Share this password securely with the team member. They should change it after first login.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all pr-20">
                                        {showPassword ? passwordModal.password : '•'.repeat(passwordModal.password.length)}
                                    </div>
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyPassword}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={copyPassword}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Password
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setPasswordModal(null)}
                                >
                                    Done
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

