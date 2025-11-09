import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Mail, Send, Crown, Shield, User, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
    {
        id: "ADMIN",
        name: "Admin",
        icon: Shield,
        description: "Can manage team members and all data",
        permissions: [
            "View and manage all data",
            "Invite and remove team members",
            "Change member roles",
            "Access all features",
        ],
    },
    {
        id: "MEMBER",
        name: "Member",
        icon: User,
        description: "Can view and manage data",
        permissions: [
            "View and manage customers",
            "View and manage sales",
            "View and manage campaigns",
            "Use AI assistant",
        ],
    },
];

export const TeamInvitePage = () => {
    const navigate = useNavigate();
    const { apiFetch } = useAuth();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [loading, setLoading] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState(null);

    const handleInvite = async (e) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!name || name.trim().length < 2) {
            toast.error("Please enter a valid name");
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetch("/team/invite", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    name: name.trim(),
                    role,
                }),
            });

            // Show success with temporary password (development only)
            if (response.tempPassword) {
                setCredentials({
                    email,
                    name: name.trim(),
                    password: response.tempPassword,
                    role
                });
                setShowCredentials(true);
            } else {
                toast.success(`Invitation sent to ${email}`);
                navigate("/team");
            }
        } catch (error) {
            console.error("Error sending invitation:", error);
            toast.error(error.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/team")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Team
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Invite Team Member</h1>
                    <p className="text-muted-foreground mt-2">
                        Send an invitation to join your team
                    </p>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                    {/* Name Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Full Name</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                The name of the team member
                            </p>
                        </CardContent>
                    </Card>

                    {/* Email Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Email Address</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                An invitation email will be sent to this address
                            </p>
                        </CardContent>
                    </Card>

                    {/* Role Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Select Role</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {ROLES.map((roleOption) => {
                                    const Icon = roleOption.icon;
                                    return (
                                        <label
                                            key={roleOption.id}
                                            className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${role === roleOption.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={roleOption.id}
                                                checked={role === roleOption.id}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                    <h3 className="font-semibold">{roleOption.name}</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {roleOption.description}
                                                </p>
                                                <div className="space-y-1">
                                                    {roleOption.permissions.map((permission) => (
                                                        <div
                                                            key={permission}
                                                            className="flex items-center gap-2 text-xs text-muted-foreground"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                                            {permission}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                                <p className="text-xs text-muted-foreground">
                                    <Crown className="h-3 w-3 inline mr-1" />
                                    <strong>Note:</strong> Only owners can assign the Owner role. Owner
                                    permissions cannot be granted through invitations.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/team")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !email}>
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Credentials Modal */}
            {showCredentials && credentials && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <CardTitle>Team Member Invited!</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-500 mb-1">Important: Save These Credentials</p>
                                        <p className="text-muted-foreground">
                                            This is the only time you'll see this password. Make sure to save it or send it to the team member securely.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm">
                                        {credentials.name}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm">
                                        {credentials.email}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Temporary Password</label>
                                    <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm break-all">
                                        {credentials.password}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                                    <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm">
                                        {credentials.role}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `Name: ${credentials.name}\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\nRole: ${credentials.role}`
                                        );
                                        toast.success("Credentials copied to clipboard!");
                                    }}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy All
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        setShowCredentials(false);
                                        navigate("/team");
                                    }}
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
