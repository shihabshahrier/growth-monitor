import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function OverviewPage() {
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/analytics/overview");
            setAnalytics(response);
        } catch (error) {
            showError("Failed to load analytics", error.message);
        } finally {
            setLoading(false);
        }
    }, [apiFetch, showError]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
        );
    }

    const metrics = [
        {
            title: "Total Revenue",
            value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
            }).format(analytics?.revenue || 0),
            change: analytics?.growth || 0,
            icon: DollarSign,
            iconColor: "text-green-600",
            iconBg: "bg-green-100",
        },
        {
            title: "Total Sales",
            value: analytics?.sales || 0,
            description: `${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
            }).format(analytics?.avgSale || 0)} avg`,
            icon: ShoppingCart,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-100",
        },
        {
            title: "Customers",
            value: analytics?.customers || 0,
            description: "Total registered",
            icon: Users,
            iconColor: "text-purple-600",
            iconBg: "bg-purple-100",
        },
        {
            title: "Active Campaigns",
            value: analytics?.campaigns || 0,
            description: "Marketing campaigns",
            icon: TrendingUp,
            iconColor: "text-orange-600",
            iconBg: "bg-orange-100",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your business metrics</p>
                </div>
                <Button onClick={() => navigate("/analytics")}>View Detailed Analytics</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                            <div className={`rounded-lg p-2 ${metric.iconBg}`}>
                                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            {metric.change !== undefined && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {metric.change >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                                    )}
                                    <span className={metric.change >= 0 ? "text-green-600" : "text-red-600"}>
                                        {Math.abs(metric.change).toFixed(1)}%
                                    </span>
                                    <span>vs last period</span>
                                </div>
                            )}
                            {metric.description && (
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="justify-start" onClick={() => navigate("/sales/new")}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Record a Sale
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => navigate("/customers/new")}>
                            <Users className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => navigate("/campaigns/new")}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Create Campaign
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => navigate("/chat")}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Ask AI Assistant
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-medium">Welcome to GrowthMonitor</h3>
                            <p className="text-sm text-muted-foreground">
                                Start by adding your customers and recording sales to unlock powerful insights.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                <span>Import data via CSV</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                <span>Chat with AI for insights</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                <span>Track campaign performance</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
