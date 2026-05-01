import { format, formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";

export function formatDate(
  date: Date | string,
  formatType: "short" | "long" | "numeric" | "monthYear" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  switch (formatType) {
    case "short":
      return format(d, "dd MMM yyyy", { locale: localeID });
    case "long":
      return format(d, "EEEE, dd MMMM yyyy", { locale: localeID });
    case "numeric":
      return format(d, "dd/MM/yyyy", { locale: localeID });
    case "monthYear":
      return format(d, "MMMM yyyy", { locale: localeID });
    default:
      return format(d, "dd MMM yyyy", { locale: localeID });
  }
}

export function formatDateRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: localeID });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: localeID });
}