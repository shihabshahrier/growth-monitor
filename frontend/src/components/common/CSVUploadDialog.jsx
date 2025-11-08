import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, X, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * CSV Upload Component
 * @param {string} endpoint - API endpoint for CSV upload (e.g., "/csv/sales/upload")
 * @param {string} templateEndpoint - API endpoint for downloading template (e.g., "/csv/sales/template")
 * @param {string} title - Modal title
 * @param {function} onSuccess - Callback function after successful upload
 */
export function CSVUploadDialog({
    endpoint,
    templateEndpoint,
    title = "Upload CSV",
    onSuccess,
    onClose
}) {
    const { apiFetch } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error("Please select a CSV file");
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        try {
            setUploading(true);

            // Read file content
            const reader = new FileReader();
            reader.onload = async (e) => {
                const csvData = e.target?.result;

                try {
                    const response = await apiFetch(endpoint, {
                        method: "POST",
                        body: JSON.stringify({ csvData }),
                    });

                    setResult(response.data);
                    toast.success(response.message || "CSV uploaded successfully");

                    if (onSuccess) {
                        onSuccess(response.data);
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    toast.error(error.message || "Failed to upload CSV");
                } finally {
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                toast.error("Failed to read file");
                setUploading(false);
            };

            reader.readAsText(file);
        } catch (error) {
            console.error("File read error:", error);
            toast.error("Failed to process file");
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}${templateEndpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('gm_access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = templateEndpoint.includes('sales') ? 'sales_template.csv' : 'campaigns_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Template downloaded");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download template");
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{title}</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Template Download */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-blue-500 mb-1">
                                    Need a template?
                                </p>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Download our CSV template to see the required format and example data.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* File Selection */}
                    {!result && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Select CSV File
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {file && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="flex-1"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload CSV
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Upload Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-500 mb-1">
                                            Upload Complete
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Successfully processed {result.created} of {result.total} records
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 rounded-lg border text-center">
                                    <p className="text-2xl font-bold text-primary">{result.total}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div className="p-3 rounded-lg border text-center">
                                    <p className="text-2xl font-bold text-green-600">{result.created}</p>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                </div>
                                <div className="p-3 rounded-lg border text-center">
                                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                    <p className="text-xs text-muted-foreground">Failed</p>
                                </div>
                            </div>

                            {/* Errors */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 max-h-48 overflow-y-auto">
                                    <div className="flex items-start gap-3 mb-2">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="font-semibold text-red-500">
                                            Errors ({result.errors.length})
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {result.errors.slice(0, 10).map((error, index) => (
                                            <p key={index} className="text-muted-foreground">
                                                Row {error.row}: {error.message}
                                            </p>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <p className="text-muted-foreground italic">
                                                ... and {result.errors.length - 10} more errors
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Upload Another
                                </Button>
                                <Button
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
