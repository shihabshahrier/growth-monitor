import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const palette = ["#e5a6ae", "#f7c8cf", "#b68c90", "#f1b493", "#a4727d"];

export default function ChannelMixChart({ data, loading }) {
  if (loading) {
    return <Skeleton />;
  }

  if (!data?.length) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          dataKey="value"
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={6}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={palette[index % palette.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${Number(value).toLocaleString()} BDT`}
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid rgba(229,166,174,0.4)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const Skeleton = () => (
  <div className="h-64 animate-pulse rounded-2xl bg-[hsla(var(--secondary)_/_0.2)]" />
);

const EmptyState = () => (
  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[hsla(var(--border)_/_0.6)] text-sm text-[hsl(var(--muted-foreground))]">
    Upload sales data to visualise channel mix.
  </div>
);
