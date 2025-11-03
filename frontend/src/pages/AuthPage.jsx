import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function AuthPage() {
  const { login, register } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!");
      } else {
        await register(form);
        toast.success("Account created!");
      }
    } catch (error) {
      toast.error("Authentication failed", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-4 py-10 text-[hsl(var(--foreground))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-10 lg:flex-row"
      >
        <div className="flex flex-1 flex-col justify-center gap-4">
          <span className="w-max rounded-full bg-[hsla(var(--primary)_/_0.15)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
            GrowthMonitor
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-[hsl(var(--foreground))] md:text-5xl">
            {t("welcomeHeadline")}
          </h1>
          <p className="max-w-md text-base text-[hsl(var(--muted-foreground))]">
            {t("welcomeTagline")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {["AI Revenue Insights", "Campaign Intelligence", "Bangla Support"].map(
              (pill) => (
                <span
                  key={pill}
                  className="rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] shadow-sm"
                >
                  {pill}
                </span>
              ),
            )}
          </div>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              {mode === "login" ? t("login") : t("signup")}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? t("welcomeBack") : "Start tracking growth in minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <Input
                  required
                  placeholder={t("name")}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              )}
              <Input
                type="email"
                required
                placeholder={t("email")}
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <Input
                type="password"
                required
                placeholder={t("password")}
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />

              <Button type="submit" disabled={loading}>
                {loading ? "..." : t("continue")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              {mode === "login" ? (
                <>
                  {t("needAccount")}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="font-medium text-[hsl(var(--primary))] underline-offset-4 hover:underline"
                  >
                    {t("signup")}
                  </button>
                </>
              ) : (
                <>
                  {t("haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="font-medium text-[hsl(var(--primary))] underline-offset-4 hover:underline"
                  >
                    {t("login")}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
