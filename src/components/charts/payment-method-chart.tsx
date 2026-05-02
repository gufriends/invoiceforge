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
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { PaymentMethodStat } from "@/types/analytics";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--muted-foreground)",
];

export function PaymentMethodChart({ data }: { data: PaymentMethodStat[] }) {
  const formatted = data.map((d, i) => ({
    method: d.method,
    name: PAYMENT_METHOD_LABELS[d.method as keyof typeof PAYMENT_METHOD_LABELS] ?? d.method,
    value: d.amount,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    formatted.map((d) => [d.method, { label: d.name, color: d.fill }])
  );

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          outerRadius={88}
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
