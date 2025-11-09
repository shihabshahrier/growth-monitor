import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    BarChart3,
    TrendingUp,
    Users,
    Target,
    DollarSign,
    ShoppingCart,
    Calendar,
    RefreshCw,
    TrendingDown,
    AlertCircle,
    Lightbulb,
    Activity,
    PieChart as PieChartIcon,
    Zap
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from "recharts";
import { toast } from "sonner";

const TABS = [
    { id: "overview", label: "Sales Overview", icon: BarChart3 },
    { id: "trends", label: "Trends & Forecasts", icon: TrendingUp },
    { id: "campaigns", label: "Campaign Analytics", icon: Target },
    { id: "customers", label: "Customer Insights", icon: Users },
    { id: "ai", label: "AI Insights", icon: Lightbulb },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AnalyticsPage = () => {
    const { apiFetch } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        overview: null,
        trends: null,
        campaigns: null,
        customers: null,
        aiInsights: null,
    });

    const loadOverview = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/overview");
            setData((prev) => ({ ...prev, overview: result.data }));
        } catch (error) {
            console.error("Error loading overview:", error);
            toast.error("Failed to load overview data");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadTrends = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/sales-trend?includeForecast=true&groupBy=day");
            setData((prev) => ({ ...prev, trends: result.data }));
        } catch (error) {
            console.error("Error loading trends:", error);
            toast.error("Failed to load sales trends");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/campaign-analytics");
            setData((prev) => ({ ...prev, campaigns: result.data }));
        } catch (error) {
            console.error("Error loading campaigns:", error);
            toast.error("Failed to load campaign analytics");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/customer-insights");
            setData((prev) => ({ ...prev, customers: result.data }));
        } catch (error) {
            console.error("Error loading customers:", error);
            toast.error("Failed to load customer insights");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadAIInsights = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/ai-insights");
            setData((prev) => ({ ...prev, aiInsights: result.data }));
        } catch (error) {
            console.error("Error loading AI insights:", error);
            toast.error("Failed to load AI insights");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await apiFetch("/analytics/cache", { method: "DELETE" });

            // Reload current tab data
            switch (activeTab) {
                case "overview":
                    await loadOverview();
                    break;
                case "trends":
                    await loadTrends();
                    break;
                case "campaigns":
                    await loadCampaigns();
                    break;
                case "customers":
                    await loadCustomers();
                    break;
                case "ai":
                    await loadAIInsights();
                    break;
            }

            toast.success("Analytics refreshed successfully");
        } catch (error) {
            console.error("Error refreshing:", error);
            toast.error("Failed to refresh analytics");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        switch (activeTab) {
            case "overview":
                if (!data.overview) loadOverview();
                break;
            case "trends":
                if (!data.trends) loadTrends();
                break;
            case "campaigns":
                if (!data.campaigns) loadCampaigns();
                break;
            case "customers":
                if (!data.customers) loadCustomers();
                break;
            case "ai":
                if (!data.aiInsights) loadAIInsights();
                break;
        }
    }, [activeTab, data, loadOverview, loadTrends, loadCampaigns, loadCustomers, loadAIInsights]);

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    // ========== SALES OVERVIEW PANEL ==========
    const renderOverview = () => {
        if (!data.overview) return null;

        const metrics = [
            {
                title: "Total Revenue",
                value: formatCurrency(data.overview.totalRevenue),
                change: data.overview.salesGrowth,
                icon: DollarSign,
                color: "text-green-600",
                bgColor: "bg-green-100 dark:bg-green-900",
            },
            {
                title: "Total Sales",
                value: data.overview.totalSales?.toLocaleString() || "0",
                subtitle: `Avg: ${formatCurrency(data.overview.avgOrderValue)}`,
                icon: ShoppingCart,
                color: "text-blue-600",
                bgColor: "bg-blue-100 dark:bg-blue-900",
            },
            {
                title: "Total Customers",
                value: data.overview.totalCustomers?.toLocaleString() || "0",
                change: data.overview.customerGrowth,
                subtitle: `${data.overview.newCustomers || 0} new`,
                icon: Users,
                color: "text-purple-600",
                bgColor: "bg-purple-100 dark:bg-purple-900",
            },
            {
                title: "Campaign ROI",
                value: formatPercent(data.overview.campaignROI),
                subtitle: `${data.overview.activeCampaigns || 0} active`,
                icon: Target,
                color: "text-orange-600",
                bgColor: "bg-orange-100 dark:bg-orange-900",
            },
        ];

        return (
            <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={metric.title}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">{metric.title}</p>
                                            <p className="text-2xl font-bold mt-2">{metric.value}</p>
                                            {metric.change !== undefined && (
                                                <p className={`text-sm mt-1 flex items-center gap-1 ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {metric.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                    {metric.change >= 0 ? "+" : ""}{formatPercent(metric.change)}
                                                </p>
                                            )}
                                            {metric.subtitle && (
                                                <p className="text-sm text-muted-foreground mt-1">{metric.subtitle}</p>
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${metric.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Top Regions and Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Regions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Regions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(data.overview.topRegions || []).map((region, idx) => (
                                    <div key={region.region} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{region.region}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatPercent(region.percentage)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-secondary rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${region.percentage}%`,
                                                        backgroundColor: COLORS[idx % COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium min-w-[80px] text-right">
                                                {formatCurrency(region.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(data.overview.topProducts || []).map((product, idx) => (
                                    <div key={product.product} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{product.product}</p>
                                                <p className="text-sm text-muted-foreground">{product.count} sold</p>
                                            </div>
                                        </div>
                                        <span className="font-bold">{formatCurrency(product.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Channel Mix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Channel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={data.overview.channelMix || []}
                                        dataKey="revenue"
                                        nameKey="channel"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => `${entry.channel}: ${formatPercent(entry.percentage)}`}
                                    >
                                        {(data.overview.channelMix || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Performance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Total Spend</p>
                                        <p className="text-xl font-bold mt-1">{formatCurrency(data.overview.totalCampaignSpend)}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">CTR</p>
                                        <p className="text-xl font-bold mt-1">{formatPercent(data.overview.ctr)}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                        <p className="text-xl font-bold mt-1">{formatPercent(data.overview.conversionRate)}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Cost per Lead</p>
                                        <p className="text-xl font-bold mt-1">{formatCurrency(data.overview.costPerLead)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    // ========== TRENDS & FORECASTS PANEL ==========
    const renderTrends = () => {
        if (!data.trends) return null;

        const { trend, categoryTrends, forecast } = data.trends;

        // Combine historical and forecast data
        const combinedData = [...(trend || [])];
        if (forecast?.forecast) {
            forecast.forecast.forEach(f => {
                combinedData.push({
                    date: f.date,
                    amount: null,
                    forecast: f.predictedAmount,
                    confidence: f.confidence
                });
            });
        }

        return (
            <div className="space-y-6">
                {/* Main Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Sales Trend & Forecast</span>
                            {forecast && (
                                <span className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    {forecast.trend === 'increasing' ? 'Trending Up' : forecast.trend === 'decreasing' ? 'Trending Down' : 'Stable'}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => formatDate(date)}
                                />
                                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'amount' || name === 'forecast') return [formatCurrency(value), name === 'amount' ? 'Actual' : 'Forecast'];
                                        return [value, name];
                                    }}
                                    labelFormatter={(date) => formatDate(date)}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Actual Sales"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Forecast"
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* AI Insights */}
                {forecast?.insights && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Forecast Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {forecast.insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <Activity className="h-4 w-4 mt-1 text-primary" />
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Category-wise Trends */}
                {categoryTrends && categoryTrends.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Category-wise Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={categoryTrends[0]?.data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        labelFormatter={(date) => formatDate(date)}
                                    />
                                    <Legend />
                                    {categoryTrends.map((cat, idx) => (
                                        <Area
                                            key={cat.category}
                                            type="monotone"
                                            dataKey="amount"
                                            data={cat.data}
                                            stackId="1"
                                            fill={COLORS[idx % COLORS.length]}
                                            stroke={COLORS[idx % COLORS.length]}
                                            name={cat.category}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // ========== CAMPAIGN ANALYTICS PANEL ==========
    const renderCampaigns = () => {
        if (!data.campaigns) return null;

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                                    <p className="text-2xl font-bold mt-2">{data.campaigns.activeCampaigns}</p>
                                    <p className="text-sm text-muted-foreground mt-1">of {data.campaigns.totalCampaigns} total</p>
                                </div>
                                <Target className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Spend</p>
                                    <p className="text-2xl font-bold mt-2">{formatCurrency(data.campaigns.totalSpend)}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Avg CTR: {formatPercent(data.campaigns.avgCTR)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                    <p className="text-2xl font-bold mt-2">{formatPercent(data.campaigns.avgConversionRate)}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{data.campaigns.totalConversions} conversions</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cost per Lead</p>
                                    <p className="text-2xl font-bold mt-2">{formatCurrency(data.campaigns.avgCostPerLead)}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{data.campaigns.totalClicks} total clicks</p>
                                </div>
                                <Activity className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Channel Efficiency */}
                <Card>
                    <CardHeader>
                        <CardTitle>Channel Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.campaigns.channelEfficiency || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="platform" />
                                <YAxis yAxisId="left" orientation="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="ctr" fill="#3b82f6" name="CTR %" />
                                <Bar yAxisId="right" dataKey="conversionRate" fill="#10b981" name="Conversion Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top and Underperforming Campaigns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <TrendingUp className="h-5 w-5" />
                                Best Performers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(data.campaigns.topPerformers || []).map((campaign) => (
                                    <div key={campaign.id} className="p-3 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{campaign.name}</span>
                                            <span className="text-green-600 font-bold">+{formatPercent(campaign.roi)}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {campaign.conversions} conversions · {formatPercent(campaign.ctr)} CTR
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Needs Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(data.campaigns.underperformers || []).map((campaign) => (
                                    <div key={campaign.id} className="p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{campaign.name}</span>
                                            <span className="text-red-600 font-bold">{formatPercent(campaign.roi)}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {campaign.conversions} conversions · {formatCurrency(campaign.costPerLead)}/lead
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Recommendations */}
                {data.campaigns.aiInsights && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                AI-Powered Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.campaigns.aiInsights.actionableInsights?.map((insight, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <Lightbulb className="h-5 w-5 mt-0.5 text-yellow-600" />
                                        <span>{insight}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // ========== CUSTOMER INSIGHTS PANEL ==========
    const renderCustomers = () => {
        if (!data.customers) return null;

        return (
            <div className="space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold mt-2">{data.customers.totalCustomers}</p>
                                <p className="text-sm text-green-600 mt-1">{data.customers.newCustomers} new</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Lifetime Value</p>
                                <p className="text-2xl font-bold mt-2">{formatCurrency(data.customers.avgLifetimeValue)}</p>
                                <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(data.customers.totalLifetimeValue)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Repeat Purchase Rate</p>
                                <p className="text-2xl font-bold mt-2">{formatPercent(data.customers.repeatPurchaseRate)}</p>
                                <p className="text-sm text-muted-foreground mt-1">{data.customers.returningCustomers} returning</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Churn Risk</p>
                                <p className="text-2xl font-bold mt-2">{formatPercent(data.customers.aiInsights?.churnRisk || 0)}</p>
                                <p className="text-sm text-red-600 mt-1">Monitor closely</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* New vs Returning */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'New Customers', value: data.customers.newCustomers },
                                            { name: 'Returning Customers', value: data.customers.returningCustomers }
                                        ]}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#10b981" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Retention Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Retention Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={data.customers.retentionTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="newCustomers" stroke="#3b82f6" strokeWidth={2} name="New Customers" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Customers by Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(data.customers.topCustomers || []).map((customer, idx) => (
                                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{customer.name}</p>
                                            {customer.email && (
                                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(customer.totalSpend)}</p>
                                        <p className="text-sm text-muted-foreground">{customer.purchaseCount} purchases</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Segments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(data.customers.aiInsights?.segments || []).map((segment) => (
                                <div key={segment.name} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{segment.name}</span>
                                        <span className="text-2xl font-bold">{segment.count}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Avg Spend: {formatCurrency(segment.avgSpend)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Recommendations */}
                {data.customers.aiInsights?.recommendations && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {data.customers.aiInsights.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 p-3 border rounded-lg">
                                        <Target className="h-4 w-4 mt-1 text-primary" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // ========== AI INSIGHTS PANEL ==========
    const renderAIInsights = () => {
        if (!data.aiInsights) return null;

        return (
            <div className="space-y-6">
                {/* Key Findings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Key Findings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(data.aiInsights.keyFindings || []).map((finding, idx) => (
                                <div key={idx} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                                    <Activity className="h-6 w-6 text-blue-600 mb-2" />
                                    <p className="text-sm">{finding}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Opportunities & Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <TrendingUp className="h-5 w-5" />
                                Growth Opportunities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {(data.aiInsights.opportunities || []).map((opp, idx) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950">
                                        <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                                        <span>{opp}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Warnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {(data.aiInsights.warnings || []).map((warning, idx) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <span>{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Observed Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {(data.aiInsights.trends || []).map((trend, idx) => (
                                <li key={idx} className="flex items-start gap-2 p-3 border rounded-lg">
                                    <Activity className="h-4 w-4 mt-1 text-primary" />
                                    <span>{trend}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Strategic Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(data.aiInsights.recommendations || []).map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 border-l-4 border-primary bg-secondary/50 rounded">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                        {idx + 1}
                                    </div>
                                    <span className="flex-1">{rec}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">Loading analytics...</p>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case "overview":
                return renderOverview();
            case "trends":
                return renderTrends();
            case "campaigns":
                return renderCampaigns();
            case "customers":
                return renderCustomers();
            case "ai":
                return renderAIInsights();
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive AI-powered business intelligence
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "border-primary text-primary font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div>{renderContent()}</div>
        </div>
    );
};
