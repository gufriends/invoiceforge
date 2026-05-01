"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { formatCurrency } from "@/utils/format-currency";
import type { TopClient } from "@/types/analytics";

export function TopClientsChart({ data }: { data: TopClient[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })} fontSize={11} stroke={axisColor} />
        <YAxis type="category" dataKey="clientName" width={120} fontSize={11} stroke={axisColor} />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            backgroundColor: tooltipBg,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            fontSize: 12,
          }}
        />
        <Bar dataKey="totalRevenue" fill="#7c3aed" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
