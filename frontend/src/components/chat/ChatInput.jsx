import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

export function ChatInput({ disabled, onSubmit, isStreaming }) {
  const { t } = useLocale();
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit?.(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-[hsla(var(--border)_/_0.6)] bg-white/80 p-4 shadow-lg backdrop-blur-lg dark:bg-[hsla(var(--secondary)_/_0.4)]"
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("chatPlaceholder")}
        disabled={disabled}
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
        <Button type="submit" disabled={disabled || !value.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isStreaming ? "..." : t("send")}
        </Button>
      </div>
    </form>
  );
}
