"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "next-themes";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { PaymentMethodStat } from "@/types/analytics";

const COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#94a3b8"];

export function PaymentMethodChart({ data }: { data: PaymentMethodStat[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const formatted = data.map((d, i) => ({
    name: PAYMENT_METHOD_LABELS[d.method as keyof typeof PAYMENT_METHOD_LABELS] ?? d.method,
    value: d.amount,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" outerRadius={90}>
          {formatted.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
