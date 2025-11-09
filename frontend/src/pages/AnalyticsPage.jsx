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
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trends", label: "Sales Trends", icon: TrendingUp },
    { id: "channels", label: "Channel Mix", icon: Target },
    { id: "customers", label: "Top Customers", icon: Users },
    { id: "campaigns", label: "Campaign Performance", icon: Target },
];

const CHANNEL_COLORS = {
    online: "#3b82f6",
    offline: "#10b981",
    retail: "#f59e0b",
    wholesale: "#8b5cf6",
    direct: "#ec4899",
};

export const AnalyticsPage = () => {
    const { apiFetch } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        overview: null,
        trends: null,
        channels: null,
        customers: null,
        campaigns: null,
    });

    const loadOverview = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/overview");
            // Backend returns {success: true, data: {...}}
            const overviewData = result.data || result;
            setData((prev) => ({ ...prev, overview: overviewData }));
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
            const result = await apiFetch("/analytics/sales-trend");
            // Backend returns {success: true, data: [...]}
            setData((prev) => ({ ...prev, trends: result.data || result.trends }));
        } catch (error) {
            console.error("Error loading trends:", error);
            toast.error("Failed to load sales trends");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadChannels = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/channel-mix");
            // Backend returns {success: true, data: [...]}
            setData((prev) => ({ ...prev, channels: result.data || result.channels }));
        } catch (error) {
            console.error("Error loading channels:", error);
            toast.error("Failed to load channel mix");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/top-customers?limit=10");
            // Backend returns {success: true, data: [...]}
            setData((prev) => ({ ...prev, customers: result.data || result.customers }));
        } catch (error) {
            console.error("Error loading customers:", error);
            toast.error("Failed to load top customers");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    const loadCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const result = await apiFetch("/analytics/campaign-performance");
            // Backend returns {success: true, data: [...]}
            setData((prev) => ({ ...prev, campaigns: result.data || result.campaigns }));
        } catch (error) {
            console.error("Error loading campaigns:", error);
            toast.error("Failed to load campaign performance");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        if (activeTab === "overview" && !data.overview) {
            loadOverview();
        } else if (activeTab === "trends" && !data.trends) {
            loadTrends();
        } else if (activeTab === "channels" && !data.channels) {
            loadChannels();
        } else if (activeTab === "customers" && !data.customers) {
            loadCustomers();
        } else if (activeTab === "campaigns" && !data.campaigns) {
            loadCampaigns();
        }
    }, [activeTab, data, loadOverview, loadTrends, loadChannels, loadCustomers, loadCampaigns]);

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
            month: "short",
            day: "numeric",
        });
    };

    const renderOverview = () => {
        if (!data.overview) return null;

        const metrics = [
            {
                title: "Total Revenue",
                value: formatCurrency(data.overview.totalRevenue || data.overview.revenue),
                icon: DollarSign,
                color: "text-green-600",
                bgColor: "bg-green-100 dark:bg-green-900",
            },
            {
                title: "Total Sales",
                value: (data.overview.totalSales || data.overview.sales)?.toLocaleString() || "0",
                icon: ShoppingCart,
                color: "text-blue-600",
                bgColor: "bg-blue-100 dark:bg-blue-900",
            },
            {
                title: "Total Customers",
                value: (data.overview.totalCustomers || data.overview.customers)?.toLocaleString() || "0",
                icon: Users,
                color: "text-purple-600",
                bgColor: "bg-purple-100 dark:bg-purple-900",
            },
            {
                title: "Active Campaigns",
                value: (data.overview.totalCampaigns || data.overview.campaigns)?.toLocaleString() || "0",
                icon: Target,
                color: "text-orange-600",
                bgColor: "bg-orange-100 dark:bg-orange-900",
            },
        ];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={metric.title}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{metric.title}</p>
                                            <p className="text-2xl font-bold mt-2">{metric.value}</p>
                                            {metric.title === "Total Revenue" && data.overview.growth && (
                                                <p className={`text-sm mt-1 ${data.overview.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {data.overview.growth > 0 ? "+" : ""}
                                                    {data.overview.growth.toFixed(1)}% from last period
                                                </p>
                                            )}
                                            {metric.title === "Total Sales" && data.overview.avgSale && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Avg: {formatCurrency(data.overview.avgSale)}
                                                </p>
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
            </div>
        );
    };

    const renderTrends = () => {
        if (!data.trends || data.trends.length === 0) {
            return (
                <Card>
                    <CardContent className="p-12 text-center">
                        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No sales trend data available</p>
                    </CardContent>
                </Card>
            );
        }

        const chartData = data.trends.map((item) => ({
            date: formatDate(item.date),
            revenue: item.revenue,
            sales: item.sales,
        }));

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "revenue") return [formatCurrency(value), "Revenue"];
                                        return [value, "Sales"];
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Revenue"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sales Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="sales" fill="#10b981" name="Number of Sales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderChannels = () => {
        if (!data.channels || data.channels.length === 0) {
            return (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No channel data available</p>
                    </CardContent>
                </Card>
            );
        }

        const pieData = data.channels.map((item) => ({
            name: item.channel,
            value: item.revenue,
            count: item.sales,
            color: CHANNEL_COLORS[item.channel] || "#6b7280",
        }));

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Channel Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.channels.map((channel) => (
                                <div key={channel.channel} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: CHANNEL_COLORS[channel.channel] || "#6b7280" }}
                                            />
                                            <span className="font-medium capitalize">{channel.channel}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{channel.sales} sales</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Revenue: {formatCurrency(channel.revenue)}</span>
                                            <span>Avg: {formatCurrency(channel.avgSale)}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${(channel.revenue / Math.max(...data.channels.map((c) => c.revenue))) * 100}%`,
                                                    backgroundColor: CHANNEL_COLORS[channel.channel] || "#6b7280",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderCustomers = () => {
        if (!data.customers || data.customers.length === 0) {
            return (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No customer data available</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Customers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.customers.map((customer, index) => (
                            <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{customer.name}</p>
                                        {customer.email && (
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(customer.totalRevenue)}</p>
                                    <p className="text-sm text-muted-foreground">{customer.totalSales} purchases</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderCampaigns = () => {
        if (!data.campaigns || data.campaigns.length === 0) {
            return (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No campaign data available</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign ROI Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.campaigns}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "roi") return [`${value.toFixed(1)}%`, "ROI"];
                                        if (name === "spend") return [formatCurrency(value), "Spend"];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="roi" fill="#10b981" name="ROI %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.campaigns.map((campaign) => (
                                <div key={campaign.id} className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{campaign.name}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{campaign.platform}</p>
                                        </div>
                                        <span
                                            className={`text-lg font-bold ${campaign.roi > 0 ? "text-green-600" : "text-red-600"}`}
                                        >
                                            {campaign.roi > 0 ? "+" : ""}
                                            {campaign.roi.toFixed(1)}% ROI
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Spend</p>
                                            <p className="font-medium">{formatCurrency(campaign.spend)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Responses</p>
                                            <p className="font-medium">{campaign.responses.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Cost/Response</p>
                                            <p className="font-medium">
                                                {campaign.responses > 0
                                                    ? formatCurrency(campaign.spend / campaign.responses)
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
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
            case "channels":
                return renderChannels();
            case "customers":
                return renderCustomers();
            case "campaigns":
                return renderCampaigns();
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
                        Comprehensive insights into your business performance
                    </p>
                </div>
                <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last 30 Days
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
