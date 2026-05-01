import { CURRENCY_LOCALES, CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";

export function formatCurrency(
  value: number,
  currency: Currency = "IDR",
  options?: { compact?: boolean; showSymbol?: boolean }
): string {
  const { compact = false, showSymbol = true } = options || {};
  const locale = CURRENCY_LOCALES[currency];

  if (compact && Math.abs(value) >= 1000) {
    const formatter = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return showSymbol ? `${CURRENCY_SYMBOLS[currency]} ${formatter.format(value)}` : formatter.format(value);
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  });

  if (!showSymbol) return formatter.format(value);

  // Force "Rp " prefix untuk IDR
  if (currency === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  }

  return formatter.format(value);
}

export function parseCurrency(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}