import { useState } from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, className, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked
          ? "bg-[hsl(var(--primary))]"
          : "bg-[hsla(var(--muted)_/_0.6)]",
        isFocused && "ring-2 ring-offset-2 ring-offset-[hsl(var(--background))] ring-[hsl(var(--ring))]",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}
