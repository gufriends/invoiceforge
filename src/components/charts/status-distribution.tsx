"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { StatusDistribution } from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "var(--status-draft)",
  SENT:      "var(--status-sent)",
  VIEWED:    "var(--status-viewed)",
  PARTIAL:   "var(--status-partial)",
  PAID:      "var(--status-paid)",
  OVERDUE:   "var(--status-overdue)",
  CANCELLED: "var(--status-cancelled)",
};

export function StatusDistributionChart({ data }: { data: StatusDistribution[] }) {
  const formatted = data.map((d) => ({
    status: d.status,
    name: INVOICE_STATUS_LABELS[d.status as keyof typeof INVOICE_STATUS_LABELS] ?? d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] ?? "var(--muted-foreground)",
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    formatted.map((d) => [d.status, { label: d.name, color: d.fill }])
  );

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          innerRadius={52}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={0}
        >
          {formatted.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="flex-wrap"
        />
      </PieChart>
    </ChartContainer>
  );
}
