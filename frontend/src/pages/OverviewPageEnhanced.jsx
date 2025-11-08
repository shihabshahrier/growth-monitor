import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    ShoppingCart,
    Lightbulb,
    ArrowRight,
    RefreshCw,
    Activity,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { toast } from "sonner";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const OverviewPage = () => {
    const navigate = useNavigate();
    const { apiFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        overview: null,
        recentInsights: [],
        salesTrend: null
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [overviewData, insightsData, trendData] = await Promise.all([
                apiFetch("/analytics/overview"),
                apiFetch("/insights"),
                apiFetch("/analytics/sales-trend?groupBy=day")
            ]);

            setData({
                overview: overviewData.data,
                recentInsights: (insightsData.insights || []).slice(0, 5),
                salesTrend: trendData.data
            });
        } catch (error) {
            console.error("Error loading dashboard:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        toast.success("Dashboard refreshed");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatPercent = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const getInsightIcon = (type) => {
        switch (type) {
            case 'opportunity': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
            default: return <Lightbulb className="h-4 w-4 text-purple-600" />;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    const overview = data.overview || {};
    const trend = data.salesTrend?.trend || [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back! Here's your business overview
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold mt-1">
                                    {formatCurrency(overview.totalRevenue)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    {overview.revenueGrowth >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={overview.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                                        {formatPercent(Math.abs(overview.revenueGrowth || 0))}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Sales</p>
                                <p className="text-2xl font-bold mt-1">{overview.totalSales || 0}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Avg: {formatCurrency(overview.avgSaleValue)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <ShoppingCart className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                                <p className="text-2xl font-bold mt-1">{overview.activeCampaigns || 0}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    ROI: {formatPercent(overview.campaignROI)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Target className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold mt-1">{overview.totalCustomers || 0}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    New: {overview.newCustomers || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Sales Trend (Last 30 Days)
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/analytics')}
                            >
                                View Details
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                No sales data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Regions/Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Top Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-3">Top Regions</h4>
                                {overview.topRegions && overview.topRegions.length > 0 ? (
                                    <div className="space-y-2">
                                        {overview.topRegions.slice(0, 5).map((region, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{region.region}</span>
                                                <span className="font-medium">{formatCurrency(region.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Top Products</h4>
                                {overview.topProducts && overview.topProducts.length > 0 ? (
                                    <div className="space-y-2">
                                        {overview.topProducts.slice(0, 5).map((product, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground truncate">{product.product}</span>
                                                <span className="font-medium">{formatCurrency(product.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Recent Insights
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/insights')}
                        >
                            View All
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.recentInsights.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/insights/${insight.id}`)}
                                >
                                    <div className="mt-1">
                                        {getInsightIcon(insight.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">{insight.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {insight.summary}
                                        </p>
                                    </div>
                                    {!insight.read && (
                                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">
                                No insights yet. Generate AI-powered insights to get started.
                            </p>
                            <Button onClick={() => navigate('/insights')}>
                                Go to Insights
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/sales')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">View Sales</h3>
                                <p className="text-sm text-muted-foreground">Manage transactions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/campaigns')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Target className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">View Campaigns</h3>
                                <p className="text-sm text-muted-foreground">Track marketing</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/customers')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">View Customers</h3>
                                <p className="text-sm text-muted-foreground">Manage contacts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
