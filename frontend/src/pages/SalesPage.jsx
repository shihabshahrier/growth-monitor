import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Upload } from "lucide-react";
import { CSVUploadDialog } from "@/components/common/CSVUploadDialog";

export function SalesPage() {
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCSVUpload, setShowCSVUpload] = useState(false);

    const loadSales = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/sales");
            setSales(response?.sales || []);
        } catch (error) {
            showError("Failed to load sales", error.message);
        } finally {
            setLoading(false);
        }
    }, [apiFetch, showError]);

    useEffect(() => {
        loadSales();
    }, [loadSales]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this sale?")) return;

        try {
            await apiFetch(`/sales/${id}`, { method: "DELETE" });
            loadSales();
        } catch (error) {
            showError("Failed to delete sale", error.message);
        }
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
                    <p className="text-muted-foreground">Track and manage your sales transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowCSVUpload(true)}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button onClick={() => navigate("/sales/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sale
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "BDT",
                            }).format(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sales.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "BDT",
                            }).format(sales.length > 0 ? totalRevenue / sales.length : 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-muted-foreground">Loading sales...</div>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-center">
                                <p className="font-medium">No sales yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Get started by recording your first sale
                                </p>
                            </div>
                            <Button onClick={() => navigate("/sales/new")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Sale
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Order ID</th>
                                            <th className="pb-3 font-medium">Product</th>
                                            <th className="pb-3 font-medium">Category</th>
                                            <th className="pb-3 font-medium">Qty</th>
                                            <th className="pb-3 font-medium">Unit Price</th>
                                            <th className="pb-3 font-medium">Total</th>
                                            <th className="pb-3 font-medium">Channel</th>
                                            <th className="pb-3 font-medium">Region</th>
                                            <th className="pb-3 font-medium">Payment</th>
                                            <th className="pb-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map((sale) => (
                                            <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3">
                                                    {new Date(sale.date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="py-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        {sale.orderId || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="font-medium">{sale.product}</div>
                                                    {sale.salesRep && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Rep: {sale.salesRep}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    {sale.category && (
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                            {sale.category}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {sale.quantity || '-'}
                                                </td>
                                                <td className="py-3">
                                                    {sale.unitPrice ? `৳${sale.unitPrice.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="py-3 font-medium">
                                                    ৳{sale.amount.toFixed(2)}
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                                                        {sale.channel}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-xs text-muted-foreground">
                                                    {sale.region || '-'}
                                                </td>
                                                <td className="py-3">
                                                    {sale.paymentMethod && (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                                                            {sale.paymentMethod}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/sales/${sale.id}/edit`)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(sale.id)}
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
                    endpoint="/csv/sales/upload"
                    templateEndpoint="/csv/sales/template"
                    title="Import Sales from CSV"
                    onSuccess={(result) => {
                        if (result.created > 0) {
                            loadSales();
                        }
                    }}
                    onClose={() => setShowCSVUpload(false)}
                />
            )}
        </div>
    );
}
