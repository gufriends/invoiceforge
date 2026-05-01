"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { StatusDistribution } from "@/types/analytics";

const COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SENT: "#3b82f6",
  VIEWED: "#06b6d4",
  PARTIAL: "#f59e0b",
  PAID: "#22c55e",
  OVERDUE: "#ef4444",
  CANCELLED: "#cbd5e1",
};

export function StatusDistributionChart({ data }: { data: StatusDistribution[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const formatted = data.map((d) => ({
    name: INVOICE_STATUS_LABELS[d.status as keyof typeof INVOICE_STATUS_LABELS] ?? d.status,
    value: d.count,
    fill: COLORS[d.status] ?? "#94a3b8",
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
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
