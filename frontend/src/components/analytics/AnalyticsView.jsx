import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const SalesTrendChart = lazy(() => import("./charts/SalesTrendChart"));
const CampaignBarChart = lazy(() => import("./charts/CampaignBarChart"));
const ChannelMixChart = lazy(() => import("./charts/ChannelMixChart"));

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export function AnalyticsView() {
  const { apiFetch, showError } = useAuth();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [salesRes, campaignsRes, insightRes] = await Promise.all([
          apiFetch("/sales"),
          apiFetch("/campaigns"),
          apiFetch("/insights"),
        ]);
        if (cancelled) return;
        setSales(salesRes?.sales ?? []);
        setCampaigns(campaignsRes?.campaigns ?? []);
        setInsights(insightRes?.insights ?? []);
      } catch (error) {
        if (!cancelled) {
          showError("Failed to load analytics", error.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, showError]);

  const metrics = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const topCampaign =
      campaigns
        .slice()
        .sort((a, b) => b.responses - a.responses)[0]?.name ?? "—";
    // Estimate repeat customers by counting distinct product per user
    const repeatCustomers = new Set(
      sales.filter((sale) => sale.amount > 0).map((sale) => sale.userId),
    ).size;

    return [
      {
        label: t("totalSales"),
        value: formatCurrency(totalSales),
        badge: "Last 30 days",
      },
      {
        label: t("topCampaign"),
        value: topCampaign,
        badge: `${campaigns.length} campaigns`,
      },
      {
        label: t("repeatCustomers"),
        value: repeatCustomers,
        badge: "Active customers",
      },
    ];
  }, [campaigns, sales, t]);

  const salesTrend = useMemo(() => {
    const byDate = sales.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString("en-CA");
      acc[date] = (acc[date] ?? 0) + sale.amount;
      return acc;
    }, {});
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sales]);

  const campaignPerformance = useMemo(
    () =>
      campaigns.map((campaign) => ({
        name: campaign.name,
        spend: campaign.spend,
        responses: campaign.responses,
      })),
    [campaigns],
  );

  const channelDistribution = useMemo(() => {
    const byChannel = sales.reduce((acc, sale) => {
      acc[sale.channel] = (acc[sale.channel] ?? 0) + sale.amount;
      return acc;
    }, {});
    return Object.entries(byChannel).map(([name, value]) => ({
      name,
      value,
    }));
  }, [sales]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-3xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{metric.badge}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("salesPerformance")}</CardTitle>
            <CardDescription>
              Daily revenue trend generated from your uploaded data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SkeletonState />}>
              <SalesTrendChart data={salesTrend} loading={loading} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("campaignPerformance")}</CardTitle>
            <CardDescription>
              Compare spend vs. responses to identify winning campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SkeletonState />}>
              <CampaignBarChart data={campaignPerformance} loading={loading} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("channelMix")}</CardTitle>
          <CardDescription>
            Visualise revenue contribution from each acquisition channel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SkeletonState />}>
            <ChannelMixChart data={channelDistribution} loading={loading} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonState() {
  return (
    <div className="flex h-60 w-full items-center justify-center rounded-2xl border border-dashed border-[hsla(var(--border)_/_0.6)] bg-[hsla(var(--secondary)_/_0.2)]">
      <div className="animate-pulse text-sm text-[hsl(var(--muted-foreground))]">
        Loading chart…
      </div>
    </div>
  );
}
