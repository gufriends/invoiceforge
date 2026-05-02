import { Image, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

export const PDF_COLORS = {
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surface: "#f8fafc",
  surface2: "#f1f5f9",
  white: "#ffffff",
};

export function PdfLogo({ src, width = 80 }: { src?: string | null; width?: number }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      style={{ width, height: width * 0.4, objectFit: "contain" } as Style}
    />
  );
}

export function PageNumber() {
  return (
    <Text
      fixed
      style={{ position: "absolute", bottom: 20, right: 40, fontSize: 8, color: "#94a3b8" } as Style}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
  );
}

export function RecurringBadge({ cycle }: { cycle: string }) {
  const labels: Record<string, string> = {
    WEEKLY: "Mingguan",
    MONTHLY: "Bulanan",
    QUARTERLY: "Triwulanan",
    YEARLY: "Tahunan",
  };
  return (
    <Text style={{ fontSize: 8, backgroundColor: "#dcfce7", color: "#15803d", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 } as Style}>
      🔁 Berulang · {labels[cycle] ?? cycle}
    </Text>
  );
}
