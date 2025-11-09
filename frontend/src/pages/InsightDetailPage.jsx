import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    ArrowLeft,
    Lightbulb,
    Target,
    AlertCircle,
    TrendingUp,
    Clock,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const INSIGHT_TYPES = {
    opportunity: {
        label: "Opportunity",
        icon: Target,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    warning: {
        label: "Warning",
        icon: AlertCircle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    trend: {
        label: "Trend",
        icon: TrendingUp,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    recommendation: {
        label: "Recommendation",
        icon: Lightbulb,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
};

export const InsightDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadInsight = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/insights/${id}`);
            setInsight(response.insight);

            // Auto-mark as read
            if (!response.insight.read) {
                await apiFetch(`/insights/${id}/read`, { method: "PUT" });
            }
        } catch (error) {
            console.error("Error loading insight:", error);
            showError("Failed to load insight", error.message);
            navigate("/insights");
        } finally {
            setLoading(false);
        }
    }, [id, apiFetch, showError, navigate]);

    useEffect(() => {
        loadInsight();
    }, [loadInsight]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this insight?")) {
            return;
        }

        try {
            await apiFetch(`/insights/${id}`, { method: "DELETE" });
            toast.success("Insight deleted successfully");
            navigate("/insights");
        } catch (error) {
            console.error("Error deleting insight:", error);
            showError("Failed to delete insight", error.message);
        }
    };

    const getInsightIcon = (type) => {
        const config = INSIGHT_TYPES[type] || INSIGHT_TYPES.recommendation;
        const Icon = config.icon;
        return <Icon className={`h-6 w-6 ${config.color}`} />;
    };

    const getInsightBadge = (type) => {
        const config = INSIGHT_TYPES[type] || INSIGHT_TYPES.recommendation;
        return (
            <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium ${config.bgColor} ${config.color}`}
            >
                {getInsightIcon(type)}
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading insight...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!insight) {
        return null;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/insights")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Insights
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Insight Details */}
            <Card>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        {/* Type and Status */}
                        <div className="flex items-center gap-3">
                            {getInsightBadge(insight.type)}
                            {insight.read && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                                    <CheckCircle className="h-3 w-3" />
                                    Read
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{insight.title}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDate(insight.createdAt)}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {insight.summary}
                            </p>
                        </div>

                        {/* Data */}
                        {insight.data && typeof insight.data === 'object' && Object.keys(insight.data).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Details</h3>
                                <Card className="bg-muted/50">
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(insight.data).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex flex-col gap-1 p-3 rounded-lg border bg-background"
                                                >
                                                    <span className="text-sm text-muted-foreground capitalize">
                                                        {key}
                                                    </span>
                                                    <span className="text-lg font-semibold">
                                                        {typeof value === "object"
                                                            ? JSON.stringify(value, null, 2)
                                                            : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
