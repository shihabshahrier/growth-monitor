import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";

const parseCsvPreview = (text) => {
  const rows = text.trim().split(/\r?\n/).slice(0, 6);
  return rows.map((row) =>
    row
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((cell) => cell.replace(/^"|"$/g, "")),
  );
};

export function UploadDialog({ open, onClose }) {
  const { apiFetch, showError, showSuccess } = useAuth();
  const { t } = useLocale();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);

  const resetState = () => {
    setFile(null);
    setPreview([]);
  };

  const handleFile = async (targetFile) => {
    if (!targetFile) return;
    if (targetFile.type !== "text/csv" && !targetFile.name.endsWith(".csv")) {
      showError(t("invalidFile"));
      return;
    }
    setFile(targetFile);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      setPreview(parseCsvPreview(text));
    };
    reader.readAsText(targetFile);
  };

  const onSelect = (event) => {
    const [selected] = event.target.files ?? [];
    handleFile(selected);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const [dropped] = event.dataTransfer.files ?? [];
    handleFile(dropped);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiFetch("/upload", {
        method: "POST",
        body: formData,
      });
      showSuccess(t("uploadSuccess"));
      resetState();
      onClose?.();
    } catch (error) {
      console.error(error);
      showError(t("uploadFailed"), error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        resetState();
        onClose?.();
      }}
      title={t("uploadData")}
      description={t("uploadSubtitle")}
      footer={[
        <Button
          key="cancel"
          variant="ghost"
          onClick={() => {
            resetState();
            onClose?.();
          }}
        >
          {t("cancel")}
        </Button>,
        <Button
          key="upload"
          onClick={upload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading…" : t("upload")}
        </Button>,
      ]}
    >
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[hsla(var(--border)_/_0.8)] bg-[hsla(var(--secondary)_/_0.3)] text-center text-[hsl(var(--muted-foreground))]"
      >
        <p className="font-medium text-[hsl(var(--foreground))]">
          {t("dropHint")}
        </p>
        <Badge>{file ? file.name : "CSV"}</Badge>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onSelect}
          className="hidden"
          id="upload-input"
        />
        <label
          htmlFor="upload-input"
          className="rounded-full border border-[hsla(var(--border)_/_0.6)] bg-white/80 px-4 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsla(var(--secondary)_/_0.45)]"
        >
          Browse
        </label>
      </div>

      {preview.length > 0 && (
        <div className="mt-5">
          <p className="font-medium text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            {t("previewTitle")}
          </p>
          <div className="mt-3 max-h-48 overflow-auto rounded-2xl border border-[hsla(var(--border)_/_0.6)] bg-white/80 text-sm dark:bg-[hsla(var(--secondary)_/_0.3)]">
            <table className="w-full min-w-[320px] divide-y divide-[hsla(var(--border)_/_0.6)]">
              <tbody>
                {preview.map((row, index) => (
                  <tr
                    key={index}
                    className="divide-x divide-[hsla(var(--border)_/_0.6)]"
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-left">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
