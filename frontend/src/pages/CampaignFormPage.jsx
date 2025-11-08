import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function CampaignFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { apiFetch, showError, showSuccess } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        platform: "Facebook",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        responses: "",
        spend: "",
        region: "",
        impressions: "",
        clicks: "",
        conversions: "",
        revenueGenerated: "",
        salesRep: "",
        status: "Active",
        remarks: "",
    });

    const loadCampaign = useCallback(async () => {
        try {
            const response = await apiFetch(`/campaigns/${id}`);
            if (response?.campaign) {
                setFormData({
                    name: response.campaign.name || "",
                    platform: response.campaign.platform || "Facebook",
                    startDate: response.campaign.startDate
                        ? new Date(response.campaign.startDate).toISOString().split("T")[0]
                        : "",
                    endDate: response.campaign.endDate
                        ? new Date(response.campaign.endDate).toISOString().split("T")[0]
                        : "",
                    responses: response.campaign.responses || "",
                    spend: response.campaign.spend || "",
                    region: response.campaign.region || "",
                    impressions: response.campaign.impressions || "",
                    clicks: response.campaign.clicks || "",
                    conversions: response.campaign.conversions || "",
                    revenueGenerated: response.campaign.revenueGenerated || "",
                    salesRep: response.campaign.salesRep || "",
                    status: response.campaign.status || "Active",
                    remarks: response.campaign.remarks || "",
                });
            }
        } catch (error) {
            showError("Failed to load campaign", error.message);
        }
    }, [id, apiFetch, showError]);

    useEffect(() => {
        if (id) {
            loadCampaign();
        }
    }, [id, loadCampaign]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                platform: formData.platform,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                responses: parseInt(formData.responses) || 0,
                spend: parseFloat(formData.spend) || 0,
                region: formData.region || undefined,
                impressions: formData.impressions ? parseInt(formData.impressions) : undefined,
                clicks: formData.clicks ? parseInt(formData.clicks) : undefined,
                conversions: formData.conversions ? parseInt(formData.conversions) : undefined,
                revenueGenerated: formData.revenueGenerated ? parseFloat(formData.revenueGenerated) : undefined,
                salesRep: formData.salesRep || undefined,
                status: formData.status || "Active",
                remarks: formData.remarks || undefined,
            };

            if (id) {
                await apiFetch(`/campaigns/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showSuccess("Campaign updated successfully");
            } else {
                await apiFetch("/campaigns", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showSuccess("Campaign created successfully");
            }
            navigate("/campaigns");
        } catch (error) {
            showError(
                id ? "Failed to update campaign" : "Failed to create campaign",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/campaigns")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {id ? "Edit Campaign" : "New Campaign"}
                    </h1>
                    <p className="text-muted-foreground">
                        {id ? "Update campaign details" : "Create a new marketing campaign"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Campaign Name <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        placeholder="Summer Sale 2024"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="platform" className="text-sm font-medium">
                                        Platform/Channel <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        id="platform"
                                        required
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.platform}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value }))}
                                    >
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Google">Google</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Twitter">Twitter</option>
                                        <option value="Email">Email</option>
                                        <option value="SMS">SMS</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="region" className="text-sm font-medium">
                                        Target Region
                                    </label>
                                    <input
                                        id="region"
                                        type="text"
                                        placeholder="Dhaka, Nationwide, etc."
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.region}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="startDate" className="text-sm font-medium">
                                        Start Date <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="startDate"
                                        type="date"
                                        required
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="endDate" className="text-sm font-medium">
                                        End Date
                                    </label>
                                    <input
                                        id="endDate"
                                        type="date"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="status" className="text-sm font-medium">
                                        Status <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        id="status"
                                        required
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="salesRep" className="text-sm font-medium">
                                        Campaign Manager
                                    </label>
                                    <input
                                        id="salesRep"
                                        type="text"
                                        placeholder="Sadia Ahmed"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.salesRep}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, salesRep: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Budget & Performance */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Budget & Performance</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <label htmlFor="spend" className="text-sm font-medium">
                                        Budget/Spend (BDT)
                                    </label>
                                    <input
                                        id="spend"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="25000"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.spend}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, spend: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="impressions" className="text-sm font-medium">
                                        Impressions
                                    </label>
                                    <input
                                        id="impressions"
                                        type="number"
                                        min="0"
                                        placeholder="120000"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.impressions}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, impressions: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clicks" className="text-sm font-medium">
                                        Clicks
                                    </label>
                                    <input
                                        id="clicks"
                                        type="number"
                                        min="0"
                                        placeholder="2500"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.clicks}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, clicks: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="responses" className="text-sm font-medium">
                                        Leads Generated
                                    </label>
                                    <input
                                        id="responses"
                                        type="number"
                                        min="0"
                                        placeholder="150"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.responses}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, responses: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="conversions" className="text-sm font-medium">
                                        Conversions
                                    </label>
                                    <input
                                        id="conversions"
                                        type="number"
                                        min="0"
                                        placeholder="45"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.conversions}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, conversions: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="revenueGenerated" className="text-sm font-medium">
                                        Revenue Generated (BDT)
                                    </label>
                                    <input
                                        id="revenueGenerated"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="72000"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.revenueGenerated}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, revenueGenerated: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <label htmlFor="remarks" className="text-sm font-medium">
                                Remarks
                            </label>
                            <textarea
                                id="remarks"
                                rows="3"
                                placeholder="Additional notes about this campaign..."
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                value={formData.remarks}
                                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : id ? "Update Campaign" : "Create Campaign"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/campaigns")}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
