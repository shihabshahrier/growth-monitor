import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Mail, Phone } from "lucide-react";

export function CustomerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { apiFetch, showError, showSuccess } = useAuth();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/customers/${id}`);
            if (response?.success) {
                setCustomer(response.data);
            }
        } catch (error) {
            showError("Failed to load customer", error.message);
        } finally {
            setLoading(false);
        }
    }, [id, apiFetch, showError]);

    useEffect(() => {
        loadCustomer();
    }, [loadCustomer]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            return;
        }

        try {
            await apiFetch(`/customers/${id}`, { method: "DELETE" });
            showSuccess("Customer deleted successfully");
            navigate("/customers");
        } catch (error) {
            showError("Failed to delete customer", error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-muted-foreground">Loading customer...</div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
                <p className="font-medium">Customer not found</p>
                <Button onClick={() => navigate("/customers")}>Back to Customers</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                        <p className="text-muted-foreground">Customer details and purchase history</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="outline" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{customer.email}</p>
                                </div>
                            </div>
                        )}
                        {customer.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{customer.phone}</p>
                                </div>
                            </div>
                        )}
                        {!customer.email && !customer.phone && (
                            <p className="text-sm text-muted-foreground">No contact information available</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Purchases</p>
                            <p className="text-2xl font-bold">
                                {customer.totalPurchases
                                    ? new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "BDT",
                                    }).format(customer.totalPurchases)
                                    : "BDT 0"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Customer Since</p>
                            <p className="font-medium">
                                {new Date(customer.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    {customer._count?.sales > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            This customer has {customer._count.sales} sale{customer._count.sales > 1 ? "s" : ""} on record.
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <p className="text-sm text-muted-foreground">No sales recorded for this customer yet</p>
                            <Button onClick={() => navigate("/sales/new")}>Create Sale</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
