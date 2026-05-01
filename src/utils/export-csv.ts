export function exportCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!data.length) return;

  const cols = headers ?? (Object.keys(data[0]) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }));
  const headerRow = cols.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const v = row[c.key];
        if (v === null || v === undefined) return "";
        return `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}