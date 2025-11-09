import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Building, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const CompanySettingsPage = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        size: "",
    });

    const loadCompany = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8080/api/team/company", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load company");
            }

            const data = await response.json();
            setCompany(data.company);
            setFormData({
                name: data.company.name || "",
                industry: data.company.industry || "",
                size: data.company.size || "",
            });
        } catch (error) {
            console.error("Error loading company:", error);
            toast.error("Failed to load company settings");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user?.role !== "owner") {
            toast.error("Only owners can access company settings");
            navigate("/team");
            return;
        }
        loadCompany();
    }, [user, loadCompany, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Company name is required");
            return;
        }

        try {
            setSaving(true);
            const response = await fetch("http://localhost:8080/api/team/company", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update company");
            }

            toast.success("Company settings updated successfully");
            loadCompany();
        } catch (error) {
            console.error("Error updating company:", error);
            toast.error("Failed to update company settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading settings...
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
                        <Building className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Company Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your company information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Name */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Company Name</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Enter company name"
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Your company name will be visible to all team members
                            </p>
                        </CardContent>
                    </Card>

                    {/* Industry */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Industry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={formData.industry}
                                onChange={(e) =>
                                    setFormData({ ...formData, industry: e.target.value })
                                }
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            >
                                <option value="">Select industry</option>
                                <option value="retail">Retail</option>
                                <option value="ecommerce">E-commerce</option>
                                <option value="saas">SaaS</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="consulting">Consulting</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="education">Education</option>
                                <option value="finance">Finance</option>
                                <option value="real-estate">Real Estate</option>
                                <option value="other">Other</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-2">
                                Helps us provide industry-specific insights
                            </p>
                        </CardContent>
                    </Card>

                    {/* Company Size */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Company Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={formData.size}
                                onChange={(e) =>
                                    setFormData({ ...formData, size: e.target.value })
                                }
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            >
                                <option value="">Select company size</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="501+">501+ employees</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-2">
                                Number of employees in your organization
                            </p>
                        </CardContent>
                    </Card>

                    {/* Company ID (Read-only) */}
                    {company && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Company ID</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                                    <code className="text-sm font-mono">{company.id}</code>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Your unique company identifier (read-only)
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/team")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900 mt-8">
                    <CardHeader>
                        <CardTitle className="text-base text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Company</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your company and all associated data
                                    </p>
                                </div>
                                <Button variant="destructive" disabled>
                                    Delete Company
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This action cannot be undone. Please contact support if you need to
                                delete your company.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
