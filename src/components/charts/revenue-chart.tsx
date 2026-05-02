"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/utils/format-currency";
import type { RevenueDataPoint } from "@/types/analytics";

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const chartConfig: ChartConfig = {
  revenue: { label: "Pendapatan", color: "var(--chart-1)" },
};

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  const formatted = data.map((d) => {
    const [y, m] = d.period.split("-");
    return { ...d, label: `${MONTHS_ID[Number(m) - 1]} ${y.slice(2)}` };
  });

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          dy={4}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })}
          width={60}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => [formatCurrency(Number(v ?? 0), "IDR"), "Pendapatan"]}
              labelClassName="font-medium"
            />
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#rev-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
