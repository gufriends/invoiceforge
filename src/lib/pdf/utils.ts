import { CURRENCY_LOCALES, CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";

export function pdfFormatCurrency(value: number, currency: Currency = "IDR") {
  if (currency === "IDR") return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(value);
}

export function pdfFormatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}