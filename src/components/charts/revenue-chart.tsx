"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { formatCurrency } from "@/utils/format-currency";
import type { RevenueDataPoint } from "@/types/analytics";

const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const formatted = data.map((d) => {
    const [y, m] = d.period.split("-");
    return { ...d, label: `${monthsID[Number(m) - 1]} ${y.slice(2)}` };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
        <YAxis stroke={axisColor} fontSize={12} tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })} />
        <Tooltip
          formatter={(v) => [formatCurrency(v as number), "Pendapatan"]}
          contentStyle={{
            backgroundColor: tooltipBg,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
