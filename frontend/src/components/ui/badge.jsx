import { cn } from "@/lib/utils";

export function Badge({ className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[hsla(var(--accent)_/_0.15)] px-3 py-1 text-xs font-medium text-[hsl(var(--accent))]",
        className,
      )}
    >
      {children}
    </span>
  );
}
