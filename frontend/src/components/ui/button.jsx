import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-glow hover:opacity-90",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsla(var(--secondary)_/_0.9)]",
  outline:
    "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsla(var(--muted)_/_0.5)]",
  ghost:
    "bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsla(var(--muted)_/_0.4)]",
  destructive:
    "bg-red-500 text-white hover:bg-red-600",
};

const sizeStyles = {
  default: "h-11 px-5 py-2 rounded-2xl",
  sm: "h-9 px-4 py-1.5 rounded-xl text-sm",
  lg: "h-12 px-6 text-base rounded-3xl",
  icon: "h-11 w-11 rounded-2xl",
};

export const Button = forwardRef(function Button(
  { className, variant = "default", size = "default", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    />
  );
});
