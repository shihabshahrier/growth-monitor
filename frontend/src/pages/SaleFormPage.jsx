import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function SaleFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { apiFetch, showError, showSuccess } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomerMode, setNewCustomerMode] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        product: "",
        amount: "",
        channel: "online",
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        orderId: "",
        category: "",
        region: "",
        quantity: "",
        unitPrice: "",
        paymentMethod: "",
        salesRep: "",
        remarks: "",
    });

    const loadCustomers = useCallback(async () => {
        try {
            const response = await apiFetch("/customers?limit=1000");
            if (response?.success) {
                setCustomers(response.data);
            }
        } catch (error) {
            console.error("Failed to load customers", error);
        }
    }, [apiFetch]);

    const loadSale = useCallback(async () => {
        try {
            const response = await apiFetch(`/sales/${id}`);
            if (response?.sale) {
                setFormData({
                    date: response.sale.date ? new Date(response.sale.date).toISOString().split("T")[0] : "",
                    product: response.sale.product || "",
                    amount: response.sale.amount || "",
                    channel: response.sale.channel || "online",
                    customerId: response.sale.customerId || "",
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    orderId: response.sale.orderId || "",
                    category: response.sale.category || "",
                    region: response.sale.region || "",
                    quantity: response.sale.quantity || "",
                    unitPrice: response.sale.unitPrice || "",
                    paymentMethod: response.sale.paymentMethod || "",
                    salesRep: response.sale.salesRep || "",
                    remarks: response.sale.remarks || "",
                });

                // If there's a linked customer, set it in the search and selected state
                if (response.sale.customer) {
                    setSelectedCustomer(response.sale.customer);
                    setCustomerSearch(response.sale.customer.name);
                }
            }
        } catch (error) {
            showError("Failed to load sale", error.message);
        }
    }, [id, apiFetch, showError]);

    useEffect(() => {
        loadCustomers();
        if (id) {
            loadSale();
        }
    }, [id, loadCustomers, loadSale]);

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (customer.phone && customer.phone.includes(customerSearch))
    );

    const handleCustomerSearch = (value) => {
        setCustomerSearch(value);
        setShowCustomerDropdown(true);
        setNewCustomerMode(false);

        // If cleared, reset selection
        if (!value) {
            setSelectedCustomer(null);
            setFormData(prev => ({ ...prev, customerId: "" }));
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
        setNewCustomerMode(false);
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: "",
            customerEmail: "",
            customerPhone: ""
        }));
    };

    const handleAddNewCustomer = () => {
        setNewCustomerMode(true);
        setShowCustomerDropdown(false);
        setSelectedCustomer(null);
        setFormData(prev => ({
            ...prev,
            customerId: "",
            customerName: customerSearch,
            customerEmail: "",
            customerPhone: ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let customerId = selectedCustomer?.id || formData.customerId;

            // If new customer mode and customer details provided, create customer first
            if (newCustomerMode && formData.customerName) {
                try {
                    const customerResponse = await apiFetch("/customers", {
                        method: "POST",
                        body: JSON.stringify({
                            name: formData.customerName,
                            email: formData.customerEmail || undefined,
                            phone: formData.customerPhone || undefined,
                        }),
                    });

                    if (customerResponse?.data) {
                        customerId = customerResponse.data.id;
                        showSuccess("Customer created successfully");
                    }
                } catch (error) {
                    console.error("Failed to create customer:", error);
                    // Continue with sale creation even if customer creation fails
                }
            }

            const payload = {
                date: new Date(formData.date).toISOString(),
                product: formData.product,
                amount: parseFloat(formData.amount),
                channel: formData.channel,
                customerId: customerId || undefined,
                orderId: formData.orderId || undefined,
                category: formData.category || undefined,
                region: formData.region || undefined,
                quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
                unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
                paymentMethod: formData.paymentMethod || undefined,
                salesRep: formData.salesRep || undefined,
                remarks: formData.remarks || undefined,
            };

            if (id) {
                await apiFetch(`/sales/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showSuccess("Sale updated successfully");
            } else {
                await apiFetch("/sales", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showSuccess("Sale created successfully");
            }
            navigate("/sales");
        } catch (error) {
            showError(id ? "Failed to update sale" : "Failed to create sale", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/sales")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {id ? "Edit Sale" : "New Sale"}
                    </h1>
                    <p className="text-muted-foreground">
                        {id ? "Update sale information" : "Record a new sale transaction"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sale Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="date" className="text-sm font-medium">
                                        Date <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="date"
                                        type="date"
                                        required
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.date}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="orderId" className="text-sm font-medium">
                                        Order ID
                                    </label>
                                    <input
                                        id="orderId"
                                        type="text"
                                        placeholder="ORD-2024-001"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, orderId: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Product Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="product" className="text-sm font-medium">
                                        Product/Service <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="product"
                                        type="text"
                                        required
                                        placeholder="Premium Cotton T-Shirt"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.product}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="category" className="text-sm font-medium">
                                        Category
                                    </label>
                                    <input
                                        id="category"
                                        type="text"
                                        placeholder="Apparel, Electronics, etc."
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.category}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="quantity" className="text-sm font-medium">
                                        Quantity
                                    </label>
                                    <input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="unitPrice" className="text-sm font-medium">
                                        Unit Price
                                    </label>
                                    <input
                                        id="unitPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="450.00"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.unitPrice}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="amount" className="text-sm font-medium">
                                        Total Amount <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="2250.00"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.amount}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="paymentMethod" className="text-sm font-medium">
                                        Payment Method
                                    </label>
                                    <select
                                        id="paymentMethod"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="bKash">bKash</option>
                                        <option value="Nagad">Nagad</option>
                                        <option value="Rocket">Rocket</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Debit Card">Debit Card</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sales Channel & Region */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Channel & Location</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="channel" className="text-sm font-medium">
                                        Sales Channel <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        id="channel"
                                        required
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.channel}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, channel: e.target.value }))}
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="In-store">In-store</option>
                                        <option value="Phone">Phone</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="region" className="text-sm font-medium">
                                        Region
                                    </label>
                                    <input
                                        id="region"
                                        type="text"
                                        placeholder="Dhaka, Chattogram, Sylhet, etc."
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.region}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Customer & Representative */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Customer & Representative</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 relative">
                                    <label htmlFor="customer" className="text-sm font-medium">
                                        Customer
                                    </label>
                                    <input
                                        id="customer"
                                        type="text"
                                        placeholder="Search or type customer name..."
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={customerSearch}
                                        onChange={(e) => handleCustomerSearch(e.target.value)}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                    />

                                    {/* Dropdown with suggestions */}
                                    {showCustomerDropdown && customerSearch && (
                                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-input bg-background shadow-lg max-h-60 overflow-y-auto">
                                            {filteredCustomers.length > 0 ? (
                                                <>
                                                    {filteredCustomers.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                                            onClick={() => handleSelectCustomer(customer)}
                                                        >
                                                            <div className="font-medium">{customer.name}</div>
                                                            {customer.email && (
                                                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                                                            )}
                                                            {customer.phone && (
                                                                <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                                            )}
                                                        </button>
                                                    ))}
                                                    <div className="border-t border-input">
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-primary font-medium"
                                                            onClick={handleAddNewCustomer}
                                                        >
                                                            + Add "{customerSearch}" as new customer
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-primary font-medium"
                                                    onClick={handleAddNewCustomer}
                                                >
                                                    + Add "{customerSearch}" as new customer
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {selectedCustomer && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Selected: {selectedCustomer.name}
                                            {selectedCustomer.email && ` (${selectedCustomer.email})`}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="salesRep" className="text-sm font-medium">
                                        Sales Representative
                                    </label>
                                    <input
                                        id="salesRep"
                                        type="text"
                                        placeholder="Karim Ahmed"
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                        value={formData.salesRep}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, salesRep: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* New Customer Details (shown when adding new customer) */}
                            {newCustomerMode && (
                                <div className="p-4 border border-input rounded-lg bg-muted/50 space-y-3">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        New Customer Details (Optional)
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label htmlFor="customerEmail" className="text-sm font-medium">
                                                Email
                                            </label>
                                            <input
                                                id="customerEmail"
                                                type="email"
                                                placeholder="customer@example.com"
                                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                                value={formData.customerEmail}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="customerPhone" className="text-sm font-medium">
                                                Phone
                                            </label>
                                            <input
                                                id="customerPhone"
                                                type="tel"
                                                placeholder="+8801712345678"
                                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                                value={formData.customerPhone}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This customer will be created and linked to this sale.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <label htmlFor="remarks" className="text-sm font-medium">
                                Remarks
                            </label>
                            <textarea
                                id="remarks"
                                rows="3"
                                placeholder="Additional notes about this sale..."
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                                value={formData.remarks}
                                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : id ? "Update Sale" : "Create Sale"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/sales")}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
