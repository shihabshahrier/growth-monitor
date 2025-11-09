import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Lightbulb,
    Plus,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Target,
    Clock,
    Eye,
    Trash2,
    Sparkles,
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

export const InsightsPage = () => {
    const navigate = useNavigate();
    const { apiFetch } = useAuth();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [generating, setGenerating] = useState(false);

    const loadInsights = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/insights");
            setInsights(data.insights || []);
        } catch (error) {
            console.error("Error loading insights:", error);
            toast.error("Failed to load insights");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        loadInsights();
    }, [loadInsights]);

    const handleGenerateInsights = async () => {
        try {
            setGenerating(true);
            await apiFetch("/insights/generate", { method: "POST" });
            toast.success("Insights generated successfully");
            loadInsights();
        } catch (error) {
            console.error("Error generating insights:", error);
            toast.error("Failed to generate insights");
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteInsight = async (id) => {
        if (!confirm("Are you sure you want to delete this insight?")) {
            return;
        }

        try {
            await apiFetch(`/insights/${id}`, { method: "DELETE" });
            toast.success("Insight deleted successfully");
            setInsights((prev) => prev.filter((i) => i.id !== id));
        } catch (error) {
            console.error("Error deleting insight:", error);
            toast.error("Failed to delete insight");
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await apiFetch(`/insights/${id}/read`, { method: "PUT" });
            setInsights((prev) =>
                prev.map((insight) =>
                    insight.id === id ? { ...insight, read: true } : insight
                )
            );
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getInsightIcon = (type) => {
        const config = INSIGHT_TYPES[type] || INSIGHT_TYPES.recommendation;
        const Icon = config.icon;
        return <Icon className={`h-5 w-5 ${config.color}`} />;
    };

    const getInsightBadge = (type) => {
        const config = INSIGHT_TYPES[type] || INSIGHT_TYPES.recommendation;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}
            >
                {getInsightIcon(type)}
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    const filteredInsights = insights.filter((insight) => {
        if (filter === "all") return true;
        if (filter === "unread") return !insight.read;
        return insight.type === filter;
    });

    const stats = {
        total: insights.length,
        unread: insights.filter((i) => !i.read).length,
        opportunities: insights.filter((i) => i.type === "opportunity").length,
        warnings: insights.filter((i) => i.type === "warning").length,
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading insights...
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
                    <h1 className="text-3xl font-bold">Insights</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-generated insights about your business
                    </p>
                </div>
                <Button onClick={handleGenerateInsights} disabled={generating}>
                    {generating ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Insights
                        </>
                    )}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Insights</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Lightbulb className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unread</p>
                                <p className="text-2xl font-bold mt-1">{stats.unread}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Eye className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Opportunities</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">
                                    {stats.opportunities}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Target className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Warnings</p>
                                <p className="text-2xl font-bold mt-1 text-yellow-600">
                                    {stats.warnings}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                                <AlertCircle className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-2 overflow-x-auto">
                        <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                        >
                            All ({insights.length})
                        </Button>
                        <Button
                            variant={filter === "unread" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("unread")}
                        >
                            Unread ({stats.unread})
                        </Button>
                        {Object.entries(INSIGHT_TYPES).map(([type, config]) => {
                            const count = insights.filter((i) => i.type === type).length;
                            return (
                                <Button
                                    key={type}
                                    variant={filter === type ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(type)}
                                >
                                    {config.label} ({count})
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Insights List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        {filter === "all" ? "All Insights" : `${filter} Insights`} (
                        {filteredInsights.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredInsights.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <Lightbulb className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Generate AI-powered insights to understand trends, identify
                                opportunities, and get recommendations for your business.
                            </p>
                            <Button onClick={handleGenerateInsights} disabled={generating}>
                                {generating ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Generate Your First Insights
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${!insight.read ? "border-l-4 border-l-primary" : ""
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getInsightBadge(insight.type)}
                                                {!insight.read && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                                                        New
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(insight.createdAt)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold mb-2">{insight.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {insight.summary}
                                            </p>
                                            {insight.data && typeof insight.data === 'object' && Object.keys(insight.data).length > 0 && (
                                                <div className="flex flex-wrap gap-3 text-sm">
                                                    {Object.entries(insight.data).map(([key, value]) => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <span className="text-muted-foreground capitalize">{key}:</span>
                                                            <span className="font-medium">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {!insight.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(insight.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/insights/${insight.id}`)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteInsight(insight.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
