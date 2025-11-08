import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Users } from "lucide-react";

export function CustomersPage() {
    const navigate = useNavigate();
    const { apiFetch, showError } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
            });
            if (searchTerm) params.append("search", searchTerm);

            const response = await apiFetch(`/customers?${params}`);
            if (response?.success) {
                setCustomers(response.data);
                if (response.pagination) {
                    setPagination((prev) => ({ ...prev, total: response.pagination.total }));
                }
            }
        } catch (error) {
            showError("Failed to load customers", error.message);
        } finally {
            setLoading(false);
        }
    }, [apiFetch, showError, pagination.page, pagination.limit, searchTerm]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;

        try {
            await apiFetch(`/customers/${id}`, { method: "DELETE" });
            loadCustomers();
        } catch (error) {
            showError("Failed to delete customer", error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">Manage your customer database</p>
                </div>
                <Button onClick={() => navigate("/customers/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Customers ({pagination.total})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-muted-foreground">Loading customers...</div>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4">
                            <Users className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-center">
                                <p className="font-medium">No customers yet</p>
                                <p className="text-sm text-muted-foreground">
                                    {searchTerm ? "Try adjusting your search" : "Get started by adding your first customer"}
                                </p>
                            </div>
                            {!searchTerm && (
                                <Button onClick={() => navigate("/customers/new")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Customer
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                {customers.map((customer) => (
                                    <div key={customer.id}>
                                        <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50">
                                            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                                                <h3 className="font-medium">{customer.name}</h3>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    {customer.email && <span>{customer.email}</span>}
                                                    {customer.phone && <span>{customer.phone}</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(customer.id)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {pagination.total > pagination.limit && (
                                <div className="flex items-center justify-between border-t pt-4">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
