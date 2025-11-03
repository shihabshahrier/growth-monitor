import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Globe2, LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export function Navbar({ onUpload, status }) {
  const { user, logout } = useAuth();
  const { locale, locales, setLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
  };

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between rounded-3xl border border-[hsla(var(--border)_/_0.5)] bg-white/80 px-6 backdrop-blur-xl dark:bg-[hsla(var(--secondary)_/_0.4)]">
      <div>
        <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          {status?.headline ?? t("ready")}
        </p>
        <p className="font-display text-lg font-semibold">
          {status?.subcopy ?? t("welcomeBack")},{" "}
          <span className="text-[hsl(var(--primary))]">{user?.name}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-2xl border border-[hsla(var(--border)_/_0.6)] bg-white/70 px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] md:flex dark:bg-[hsla(var(--secondary)_/_0.5)]">
          <Globe2 className="h-4 w-4 text-[hsl(var(--primary))]" />
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            {Object.entries(locales).map(([code, label]) => (
              <option key={code} value={code} className="text-black">
                {label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="ghost"
          className="hidden gap-3 md:flex"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" />
              {t("light")}
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              {t("dark")}
            </>
          )}
        </Button>

        <Button variant="secondary" onClick={onUpload}>
          {t("uploadData")}
        </Button>

        <div className="flex items-center gap-3 rounded-2xl border border-[hsla(var(--border)_/_0.6)] bg-gradient-rose px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] shadow-glow">
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase text-[hsl(var(--muted-foreground))]">
              {t("language")}
            </span>
            <span>{locales[locale]}</span>
          </div>
          <Switch
            checked={locale === "bn"}
            onChange={(checked) => setLocale(checked ? "bn" : "en")}
          />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsla(var(--border)_/_0.6)] bg-white/80 text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] dark:bg-[hsla(var(--secondary)_/_0.5)]",
          )}
          aria-label={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
