import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    TrendingUp,
    Edit,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const CampaignDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCampaign = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/campaigns/${id}`);
            setCampaign(response.campaign);
        } catch (error) {
            console.error("Error loading campaign:", error);
            showError("Failed to load campaign", error.message);
            navigate("/campaigns");
        } finally {
            setLoading(false);
        }
    }, [id, apiFetch, showError, navigate]);

    useEffect(() => {
        loadCampaign();
    }, [loadCampaign]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this campaign?")) {
            return;
        }

        try {
            await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
            toast.success("Campaign deleted successfully");
            navigate("/campaigns");
        } catch (error) {
            console.error("Error deleting campaign:", error);
            showError("Failed to delete campaign", error.message);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const calculateROI = () => {
        if (!campaign || !campaign.spend || campaign.spend === 0) {
            return null;
        }
        // Assuming each response is worth 100 BDT
        const estimatedRevenue = campaign.responses * 100;
        const roi = ((estimatedRevenue - campaign.spend) / campaign.spend) * 100;
        return roi;
    };

    const getCostPerResponse = () => {
        if (!campaign || !campaign.responses || campaign.responses === 0) {
            return null;
        }
        return campaign.spend / campaign.responses;
    };

    const getPlatformColor = (platform) => {
        const colors = {
            Facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            Instagram:
                "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
            Google:
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            LinkedIn:
                "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
            Twitter:
                "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
            Email:
                "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
            Other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        };
        return colors[platform] || colors.Other;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading campaign...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    const roi = calculateROI();
    const costPerResponse = getCostPerResponse();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/campaigns")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Campaigns
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/campaigns/${id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Campaign Info Card */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{campaign.name}</h1>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(campaign.platform)}`}
                                >
                                    {campaign.platform}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Calendar className="h-5 w-5" />
                                <div>
                                    <p className="text-sm">Campaign Period</p>
                                    <p className="text-base font-medium text-foreground">
                                        {formatDate(campaign.startDate)}
                                        {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-muted-foreground">
                                <DollarSign className="h-5 w-5" />
                                <div>
                                    <p className="text-sm">Total Spend</p>
                                    <p className="text-base font-medium text-foreground">
                                        {formatCurrency(campaign.spend)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <TrendingUp className="h-5 w-5" />
                                <div>
                                    <p className="text-sm">Total Responses</p>
                                    <p className="text-base font-medium text-foreground">
                                        {campaign.responses.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {campaign.metadata && Object.keys(campaign.metadata).length > 0 && (
                                <div className="flex items-start gap-3 text-muted-foreground">
                                    <div>
                                        <p className="text-sm">Additional Details</p>
                                        <div className="text-base font-medium text-foreground">
                                            {Object.entries(campaign.metadata).map(([key, value]) => (
                                                <p key={key} className="text-sm">
                                                    <span className="text-muted-foreground">{key}:</span>{" "}
                                                    {String(value)}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Cost per Response</p>
                        <p className="text-2xl font-bold">
                            {costPerResponse !== null
                                ? formatCurrency(costPerResponse)
                                : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {costPerResponse !== null
                                ? `${campaign.responses} responses generated`
                                : "No responses yet"}
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Estimated ROI</p>
                        <p
                            className={`text-2xl font-bold ${roi !== null ? (roi > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : ""}`}
                        >
                            {roi !== null ? `${roi > 0 ? "+" : ""}${roi.toFixed(1)}%` : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {roi !== null
                                ? "Based on estimated response value"
                                : "Insufficient data"}
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Campaign Status</p>
                        <p className="text-2xl font-bold">
                            {campaign.endDate && new Date(campaign.endDate) < new Date()
                                ? "Completed"
                                : "Active"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {campaign.endDate
                                ? new Date(campaign.endDate) < new Date()
                                    ? `Ended ${formatDate(campaign.endDate)}`
                                    : `Ends ${formatDate(campaign.endDate)}`
                                : "No end date set"}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
