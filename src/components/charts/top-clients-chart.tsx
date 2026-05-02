"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/utils/format-currency";
import type { TopClient } from "@/types/analytics";

const chartConfig: ChartConfig = {
  totalRevenue: { label: "Pendapatan", color: "var(--chart-4)" },
};

export function TopClientsChart({ data }: { data: TopClient[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 4, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })}
        />
        <YAxis
          type="category"
          dataKey="clientName"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => [formatCurrency(Number(v ?? 0), "IDR"), "Pendapatan"]}
            />
          }
        />
        <Bar
          dataKey="totalRevenue"
          fill="var(--color-totalRevenue)"
          radius={[0, 6, 6, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
