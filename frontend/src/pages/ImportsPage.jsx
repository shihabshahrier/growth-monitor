import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext"; // TODO: Use for real API calls
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Database,
    TrendingUp,
    FileText,
} from "lucide-react";
import { toast } from "sonner";

export const ImportsPage = () => {
    const navigate = useNavigate();
    // const { token } = useAuth(); // TODO: Use for real API calls
    const [imports, setImports] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadImports = useCallback(async () => {
        try {
            setLoading(true);
            // For now, use mock data since the backend might not have import history endpoint
            // In production, this would be: GET /api/import/history

            // Mock data
            await new Promise((resolve) => setTimeout(resolve, 500));

            const mockImports = [
                {
                    id: "1",
                    type: "sales",
                    filename: "sales_q4_2024.csv",
                    status: "completed",
                    imported: 150,
                    failed: 5,
                    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                },
                {
                    id: "2",
                    type: "campaigns",
                    filename: "marketing_campaigns.csv",
                    status: "completed",
                    imported: 25,
                    failed: 0,
                    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                },
                {
                    id: "3",
                    type: "sales",
                    filename: "sales_q3_2024.csv",
                    status: "failed",
                    imported: 0,
                    failed: 200,
                    error: "Invalid date format in row 45",
                    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                },
            ];

            setImports(mockImports);
        } catch (error) {
            console.error("Error loading imports:", error);
            toast.error("Failed to load import history");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImports();
    }, [loadImports]);

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "failed":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "processing":
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        };
        return styles[status] || styles.pending;
    };

    const getTypeIcon = (type) => {
        return type === "sales" ? (
            <Database className="h-4 w-4" />
        ) : (
            <TrendingUp className="h-4 w-4" />
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

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading import history...
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
                    <h1 className="text-3xl font-bold">Import History</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage your CSV imports
                    </p>
                </div>
                <Button onClick={() => navigate("/import-wizard")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Import
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Imports</p>
                                <p className="text-2xl font-bold mt-1">{imports.length}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Successful</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">
                                    {imports.filter((i) => i.status === "completed").length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Failed</p>
                                <p className="text-2xl font-bold mt-1 text-red-600">
                                    {imports.filter((i) => i.status === "failed").length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Import List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Imports</CardTitle>
                </CardHeader>
                <CardContent>
                    {imports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No imports yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Start importing your sales or campaign data from CSV files to see them here.
                            </p>
                            <Button onClick={() => navigate("/import-wizard")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Start Your First Import
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {imports.map((importRecord) => (
                                <div
                                    key={importRecord.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-2 rounded-lg bg-muted">
                                            {getTypeIcon(importRecord.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-medium truncate">
                                                    {importRecord.filename}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(importRecord.status)}`}
                                                >
                                                    {importRecord.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground capitalize mb-2">
                                                {importRecord.type} data
                                            </p>
                                            {importRecord.status === "completed" && (
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-green-600">
                                                        ✓ {importRecord.imported} imported
                                                    </span>
                                                    {importRecord.failed > 0 && (
                                                        <span className="text-red-600">
                                                            ✗ {importRecord.failed} failed
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {importRecord.status === "failed" && importRecord.error && (
                                                <p className="text-sm text-red-600">
                                                    Error: {importRecord.error}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(importRecord.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-4">{getStatusIcon(importRecord.status)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
