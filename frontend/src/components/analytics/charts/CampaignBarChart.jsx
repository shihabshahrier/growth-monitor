import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function CampaignBarChart({ data, loading }) {
  if (loading) {
    return <Skeleton />;
  }

  if (!data?.length) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="4 8" stroke="#eadbdc" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          stroke="transparent"
        />
        <YAxis
          tickFormatter={(value) => `${Math.round(value)}`}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          stroke="transparent"
        />
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid rgba(229,166,174,0.4)",
          }}
        />
        <Legend />
        <Bar dataKey="responses" fill="#e5a6ae" radius={[12, 12, 0, 0]} />
        <Bar dataKey="spend" fill="#b68c90" radius={[12, 12, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const Skeleton = () => (
  <div className="h-60 animate-pulse rounded-2xl bg-[hsla(var(--secondary)_/_0.2)]" />
);

const EmptyState = () => (
  <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-[hsla(var(--border)_/_0.6)] text-sm text-[hsl(var(--muted-foreground))]">
    Upload campaign data to view performance.
  </div>
);
