import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Upload } from "lucide-react";
import { CSVUploadDialog } from "@/components/common/CSVUploadDialog";

export function CampaignsPage() {
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCSVUpload, setShowCSVUpload] = useState(false);

    const loadCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/campaigns");
            setCampaigns(response?.campaigns || []);
        } catch (error) {
            showError("Failed to load campaigns", error.message);
        } finally {
            setLoading(false);
        }
    }, [apiFetch, showError]);

    useEffect(() => {
        loadCampaigns();
    }, [loadCampaigns]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;

        try {
            await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
            loadCampaigns();
        } catch (error) {
            showError("Failed to delete campaign", error.message);
        }
    };

    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalResponses = campaigns.reduce((sum, c) => sum + (c.responses || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">Track and analyze your marketing campaigns</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowCSVUpload(true)}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button onClick={() => navigate("/campaigns/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Campaign
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "BDT",
                            }).format(totalSpend)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalResponses.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-muted-foreground">Loading campaigns...</div>
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4">
                            <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-center">
                                <p className="font-medium">No campaigns yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Start tracking your marketing efforts
                                </p>
                            </div>
                            <Button onClick={() => navigate("/campaigns/new")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Campaign
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="pb-3 font-medium">Campaign</th>
                                            <th className="pb-3 font-medium">Channel</th>
                                            <th className="pb-3 font-medium">Period</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium text-right">Budget</th>
                                            <th className="pb-3 font-medium text-right">Impressions</th>
                                            <th className="pb-3 font-medium text-right">Clicks</th>
                                            <th className="pb-3 font-medium text-right">Leads</th>
                                            <th className="pb-3 font-medium text-right">Conversions</th>
                                            <th className="pb-3 font-medium text-right">Revenue</th>
                                            <th className="pb-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3">
                                                    <div className="font-medium">{campaign.name}</div>
                                                    {campaign.region && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {campaign.region}
                                                        </div>
                                                    )}
                                                    {campaign.salesRep && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Manager: {campaign.salesRep}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                                                        {campaign.platform}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-xs">
                                                    <div>{new Date(campaign.startDate).toLocaleDateString('en-GB')}</div>
                                                    <div className="text-muted-foreground">
                                                        {campaign.endDate
                                                            ? new Date(campaign.endDate).toLocaleDateString('en-GB')
                                                            : "Ongoing"}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${campaign.status === 'Active'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : campaign.status === 'Completed'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                        }`}>
                                                        {campaign.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    ৳{campaign.spend.toFixed(0)}
                                                </td>
                                                <td className="py-3 text-right text-muted-foreground">
                                                    {campaign.impressions ? campaign.impressions.toLocaleString() : '-'}
                                                </td>
                                                <td className="py-3 text-right text-muted-foreground">
                                                    {campaign.clicks ? campaign.clicks.toLocaleString() : '-'}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {campaign.responses}
                                                </td>
                                                <td className="py-3 text-right text-muted-foreground">
                                                    {campaign.conversions || '-'}
                                                </td>
                                                <td className="py-3 text-right font-medium text-green-600 dark:text-green-400">
                                                    {campaign.revenueGenerated
                                                        ? `৳${campaign.revenueGenerated.toFixed(0)}`
                                                        : '-'}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(campaign.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CSV Upload Dialog */}
            {showCSVUpload && (
                <CSVUploadDialog
                    endpoint="/csv/campaigns/upload"
                    templateEndpoint="/csv/campaigns/template"
                    title="Import Campaigns from CSV"
                    onSuccess={(result) => {
                        if (result.created > 0) {
                            loadCampaigns();
                        }
                    }}
                    onClose={() => setShowCSVUpload(false)}
                />
            )}
        </div>
    );
}
