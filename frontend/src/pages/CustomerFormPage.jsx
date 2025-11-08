import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function CustomerFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { apiFetch, showError, showSuccess } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        metadata: {},
    });

    const loadCustomer = useCallback(async () => {
        try {
            const response = await apiFetch(`/customers/${id}`);
            if (response?.success) {
                setFormData({
                    name: response.data.name || "",
                    email: response.data.email || "",
                    phone: response.data.phone || "",
                    metadata: response.data.metadata || {},
                });
            }
        } catch (error) {
            showError("Failed to load customer", error.message);
        }
    }, [id, apiFetch, showError]);

    useEffect(() => {
        if (id) {
            loadCustomer();
        }
    }, [id, loadCustomer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined,
            };

            if (id) {
                await apiFetch(`/customers/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showSuccess("Customer updated successfully");
            } else {
                await apiFetch("/customers", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showSuccess("Customer created successfully");
            }
            navigate("/customers");
        } catch (error) {
            showError(id ? "Failed to update customer" : "Failed to create customer", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {id ? "Edit Customer" : "New Customer"}
                    </h1>
                    <p className="text-muted-foreground">
                        {id ? "Update customer information" : "Add a new customer to your database"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                value={formData.email}
                                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium">
                                Phone
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                value={formData.phone}
                                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : id ? "Update Customer" : "Create Customer"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/customers")}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
