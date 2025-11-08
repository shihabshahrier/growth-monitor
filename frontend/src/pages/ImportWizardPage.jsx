import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Database,
    TrendingUp,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
    { id: 1, name: "Upload", description: "Select CSV file" },
    { id: 2, name: "Preview", description: "Review data" },
    { id: 3, name: "Validate", description: "Check for errors" },
    { id: 4, name: "Import", description: "Start import" },
    { id: 5, name: "Complete", description: "View results" },
];

const IMPORT_TYPES = [
    {
        id: "sales",
        name: "Sales Data",
        icon: Database,
        description: "Import sales transactions with customer information",
        fields: ["date", "amount", "product", "channel", "customerName", "customerEmail"],
    },
    {
        id: "campaigns",
        name: "Campaign Data",
        icon: TrendingUp,
        description: "Import marketing campaign performance data",
        fields: ["name", "platform", "startDate", "endDate", "spend", "responses"],
    },
];

export const ImportWizardPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [importType, setImportType] = useState(null);
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [importStatus, setImportStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
                setFile(droppedFile);
            } else {
                toast.error("Please upload a CSV file");
            }
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
                setFile(selectedFile);
            } else {
                toast.error("Please upload a CSV file");
            }
        }
    };

    const handlePreview = async () => {
        if (!file || !importType) {
            toast.error("Please select import type and file");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", importType);

            const response = await fetch("http://localhost:8080/api/import/preview", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to preview file");
            }

            const data = await response.json();
            setPreviewData(data);
            setCurrentStep(2);
        } catch (error) {
            console.error("Error previewing file:", error);
            toast.error("Failed to preview file");
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!previewData) return;

        try {
            setLoading(true);
            setCurrentStep(3);

            // Simulate validation
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const errors = [];
            const warnings = [];

            // Basic validation logic
            previewData.rows.forEach((row, index) => {
                if (importType === "sales") {
                    if (!row.amount || isNaN(parseFloat(row.amount))) {
                        errors.push(`Row ${index + 1}: Invalid amount`);
                    }
                    if (!row.date) {
                        errors.push(`Row ${index + 1}: Missing date`);
                    }
                } else if (importType === "campaigns") {
                    if (!row.name) {
                        errors.push(`Row ${index + 1}: Missing campaign name`);
                    }
                    if (!row.spend || isNaN(parseFloat(row.spend))) {
                        warnings.push(`Row ${index + 1}: Invalid spend amount`);
                    }
                }
            });

            setValidationResult({
                valid: errors.length === 0,
                errors,
                warnings,
                totalRows: previewData.rows.length,
                validRows: previewData.rows.length - errors.length,
            });
        } catch (error) {
            console.error("Error validating:", error);
            toast.error("Validation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!validationResult?.valid && validationResult?.errors.length > 0) {
            toast.error("Please fix validation errors before importing");
            return;
        }

        try {
            setLoading(true);
            setCurrentStep(4);

            const formData = new FormData();
            formData.append("file", file);

            const endpoint = importType === "sales"
                ? "http://localhost:8080/api/import/sales"
                : "http://localhost:8080/api/import/campaigns";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to start import");
            }

            const data = await response.json();
            setJobId(data.jobId);

            // Poll for status
            pollImportStatus(data.jobId);
        } catch (error) {
            console.error("Error starting import:", error);
            toast.error("Failed to start import");
            setLoading(false);
        }
    };

    const pollImportStatus = async (id) => {
        const maxAttempts = 30;
        let attempts = 0;

        const poll = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/import/status/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to get import status");
                }

                const data = await response.json();
                setImportStatus(data);

                if (data.status === "completed") {
                    setCurrentStep(5);
                    setLoading(false);
                    toast.success("Import completed successfully!");
                } else if (data.status === "failed") {
                    setLoading(false);
                    toast.error("Import failed");
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(poll, 2000);
                } else {
                    setLoading(false);
                    toast.error("Import timeout");
                }
            } catch (error) {
                console.error("Error polling status:", error);
                setLoading(false);
                toast.error("Failed to check import status");
            }
        };

        poll();
    };

    const resetWizard = () => {
        setCurrentStep(1);
        setImportType(null);
        setFile(null);
        setPreviewData(null);
        setValidationResult(null);
        setJobId(null);
        setImportStatus(null);
        setLoading(false);
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${currentStep > step.id
                                    ? "bg-green-500 border-green-500 text-white"
                                    : currentStep === step.id
                                        ? "bg-primary border-primary text-white"
                                        : "bg-background border-muted-foreground text-muted-foreground"
                                }`}
                        >
                            {currentStep > step.id ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <span className="text-sm font-medium">{step.id}</span>
                            )}
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-xs font-medium">{step.name}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                    {index < STEPS.length - 1 && (
                        <div
                            className={`w-16 h-0.5 mb-8 mx-2 transition-colors ${currentStep > step.id ? "bg-green-500" : "bg-muted"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {IMPORT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <Card
                            key={type.id}
                            className={`cursor-pointer transition-all ${importType === type.id
                                    ? "ring-2 ring-primary bg-primary/5"
                                    : "hover:bg-muted/50"
                                }`}
                            onClick={() => setImportType(type.id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">{type.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {type.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {type.fields.map((field) => (
                                                <span
                                                    key={field}
                                                    className="px-2 py-1 rounded text-xs bg-muted"
                                                >
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardContent className="p-6">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-4">
                                <FileText className="h-12 w-12 mx-auto text-green-500" />
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setFile(null)}>
                                    Change File
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                <div>
                                    <p className="font-medium mb-1">
                                        Drag and drop your CSV file here
                                    </p>
                                    <p className="text-sm text-muted-foreground">or</p>
                                </div>
                                <label>
                                    <Button variant="outline" asChild>
                                        <span>
                                            Browse Files
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handlePreview}
                    disabled={!file || !importType || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading Preview...
                        </>
                    ) : (
                        <>
                            Next: Preview Data
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Found {previewData?.rows?.length || 0} rows
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Showing first {Math.min(10, previewData?.rows?.length || 0)} rows
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    {previewData?.headers?.map((header) => (
                                        <th
                                            key={header}
                                            className="text-left p-3 text-sm font-medium bg-muted"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData?.rows?.slice(0, 10).map((row, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                        {previewData.headers.map((header) => (
                                            <td key={header} className="p-3 text-sm">
                                                {row[header] || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handleValidate} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                        </>
                    ) : (
                        <>
                            Next: Validate Data
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {validationResult?.valid ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Validation Passed
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                Validation Issues Found
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm text-muted-foreground">Total Rows</p>
                            <p className="text-2xl font-bold">{validationResult?.totalRows}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-muted-foreground">Valid Rows</p>
                            <p className="text-2xl font-bold text-green-600">
                                {validationResult?.validRows}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <p className="text-sm text-muted-foreground">Errors</p>
                            <p className="text-2xl font-bold text-red-600">
                                {validationResult?.errors?.length || 0}
                            </p>
                        </div>
                    </div>

                    {validationResult?.errors?.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-red-600">Errors:</h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {validationResult.errors.map((error, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {validationResult?.warnings?.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-yellow-600">Warnings:</h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {validationResult.warnings.map((warning, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <span>{warning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={handleImport}
                    disabled={loading || (validationResult?.errors?.length > 0)}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting Import...
                        </>
                    ) : (
                        <>
                            Start Import
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-12 text-center">
                    <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Importing Data...</h3>
                    <p className="text-muted-foreground">
                        Please wait while we process your file
                    </p>
                    {importStatus && (
                        <div className="mt-6 space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Job ID: {jobId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Status: {importStatus.status}
                            </p>
                            {importStatus.progress && (
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${importStatus.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
                    <p className="text-muted-foreground mb-6">
                        Your data has been successfully imported
                    </p>

                    {importStatus?.result && (
                        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground">Imported</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {importStatus.result.imported || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground">Failed</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {importStatus.result.failed || 0}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <Button onClick={resetWizard}>Import Another File</Button>
                        <Button variant="outline" onClick={() => navigate(`/${importType === 'sales' ? 'sales' : 'campaigns'}`)}>
                            View {importType === 'sales' ? 'Sales' : 'Campaigns'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Import Wizard</h1>
                    <p className="text-muted-foreground mt-1">
                        Import your data from CSV files
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate("/imports")}>
                    View Import History
                </Button>
            </div>

            {renderStepIndicator()}

            <div>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
            </div>
        </div>
    );
};
