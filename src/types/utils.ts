import type { Currency } from "@/lib/constants";

export type FormatCurrencyFn = (
  value: number,
  currency?: Currency,
  options?: { compact?: boolean; showSymbol?: boolean }
) => string;

export type FormatDateFn = (
  date: Date | string,
  format?: "short" | "long" | "numeric" | "monthYear"
) => string;

export type GenerateInvoiceNumberFn = (
  prefix: string,
  year: number,
  sequence: number
) => string;

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export type CalculateInvoiceTotalsFn = (input: {
  items: { quantity: unknown; unitPrice: unknown }[];
  taxRate: unknown;
  discountType: string | undefined;
  discountValue: unknown;
}) => InvoiceTotals;

export type ExportCsvFn = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) => void;