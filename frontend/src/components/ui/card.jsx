import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[hsla(var(--border)_/_0.6)] bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(202,138,148,0.6)] backdrop-blur-lg dark:bg-[hsl(var(--card))] dark:border-[hsl(var(--border))] dark:text-[hsl(var(--card-foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-semibold leading-none tracking-tight text-[hsl(var(--foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-[hsl(var(--muted-foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("mt-5 flex flex-col gap-4", className)} {...props}>
      {children}
    </div>
  );
}
