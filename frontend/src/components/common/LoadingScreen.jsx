export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[hsla(var(--primary)_/_0.3)] border-t-[hsl(var(--primary))]" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Preparing GrowthMonitor…
      </p>
    </div>
  );
}
