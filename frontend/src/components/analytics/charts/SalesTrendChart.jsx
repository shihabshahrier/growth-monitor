import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SalesTrendChart({ data, loading }) {
  if (loading) {
    return <Skeleton />;
  }

  if (!data?.length) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e5a6ae" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#e5a6ae" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 8" stroke="#e8d6d9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          stroke="transparent"
        />
        <YAxis
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          stroke="transparent"
        />
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid rgba(229,166,174,0.4)",
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#e5a6ae"
          strokeWidth={2.4}
          fillOpacity={1}
          fill="url(#salesGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const Skeleton = () => (
  <div className="h-60 animate-pulse rounded-2xl bg-[hsla(var(--secondary)_/_0.2)]" />
);

const EmptyState = () => (
  <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-[hsla(var(--border)_/_0.6)] text-sm text-[hsl(var(--muted-foreground))]">
    No sales data yet.
  </div>
);
