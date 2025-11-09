import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

export function ChatInput({ disabled, onSubmit, isStreaming }) {
  const { t } = useLocale();
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!value.trim() || disabled || isSubmitting) return;

    const message = value.trim();
    setValue(""); // Clear immediately to prevent double submit
    setIsSubmitting(true);

    try {
      await onSubmit?.(message);
    } finally {
      // Reset after a delay to prevent rapid double-clicks
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const handleKeyDown = (event) => {
    // Submit on Enter (without Shift)
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-[hsla(var(--border)_/_0.6)] bg-white/80 p-4 shadow-lg backdrop-blur-lg dark:bg-[hsla(var(--secondary)_/_0.4)]"
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("chatPlaceholder")}
        disabled={disabled || isSubmitting}
        className="min-h-[80px] resize-none bg-transparent"
      />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className={cn("gap-2 text-[hsl(var(--muted-foreground))]", disabled && "opacity-50")}
          disabled
        >
          <Mic className="h-4 w-4" />
          {t("speaking")}
        </Button>
        <Button type="submit" disabled={disabled || !value.trim() || isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isStreaming || isSubmitting ? "..." : t("send")}
        </Button>
      </div>
    </form>
  );
}
