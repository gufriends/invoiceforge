import type { Currency } from "@/lib/constants";
import type { InvoiceItemFormValues } from "./forms";

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
  items: Pick<InvoiceItemFormValues, "quantity" | "unitPrice">[];
  taxRate: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}) => InvoiceTotals;

export type ExportCsvFn = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) => void;