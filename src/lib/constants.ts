export const APP_NAME = "InvoiceForge";
export const APP_DESCRIPTION = "Platform invoice & client management untuk freelancer & UMKM Indonesia";

export const DEFAULT_CURRENCY = "IDR" as const;
export const DEFAULT_TAX_RATE = 11; // PPN 11%
export const DEFAULT_INVOICE_PREFIX = "INV";
export const DEFAULT_PAYMENT_TERM_DAYS = 30;

export const CURRENCIES = ["IDR", "USD", "SGD", "MYR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  IDR: "Rp",
  USD: "$",
  SGD: "S$",
  MYR: "RM",
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  IDR: "id-ID",
  USD: "en-US",
  SGD: "en-SG",
  MYR: "ms-MY",
};

export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Terkirim",
  VIEWED: "Dilihat",
  PARTIAL: "Dibayar Sebagian",
  PAID: "Lunas",
  OVERDUE: "Jatuh Tempo",
  CANCELLED: "Dibatalkan",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  VIEWED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-slate-200 text-slate-500 line-through dark:bg-slate-700 dark:text-slate-500",
};

export const PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "CASH",
  "E_WALLET",
  "QRIS",
  "CHEQUE",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Transfer Bank",
  CASH: "Tunai",
  E_WALLET: "E-Wallet",
  QRIS: "QRIS",
  CHEQUE: "Cek",
  OTHER: "Lainnya",
};

export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const RECURRING_CYCLES = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;
export type RecurringCycle = (typeof RECURRING_CYCLES)[number];

export const RECURRING_CYCLE_LABELS: Record<RecurringCycle, string> = {
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  QUARTERLY: "Triwulanan",
  YEARLY: "Tahunan",
};

export const INVOICE_TEMPLATES = ["modern", "classic", "minimal"] as const;
export type InvoiceTemplate = (typeof INVOICE_TEMPLATES)[number];

export const INVOICE_TEMPLATE_LABELS: Record<InvoiceTemplate, string> = {
  modern: "Modern",
  classic: "Klasik",
  minimal: "Minimalis",
};

export const PROVINCES_ID = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DI Yogyakarta",
  "Banten",
  "Bali",
  "Sumatera Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Riau",
  "Kepulauan Riau",
  "Lampung",
  "Bengkulu",
  "Jambi",
  "Aceh",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Sulawesi Tengah",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Sulawesi Barat",
  "Gorontalo",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
] as const;

export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const PAGINATION_MAX_LIMIT = 100;

export const QUERY_KEYS = {
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
  invoiceStats: ["invoices", "stats"] as const,
  invoiceNumber: ["invoices", "number"] as const,
  clients: ["clients"] as const,
  client: (id: string) => ["clients", id] as const,
  clientStats: (id: string) => ["clients", id, "stats"] as const,
  clientInvoices: (id: string) => ["clients", id, "invoices"] as const,
  payments: (invoiceId: string) => ["payments", invoiceId] as const,
  company: ["company"] as const,
  analytics: {
    overview: ["analytics", "overview"] as const,
    revenue: (range: string) => ["analytics", "revenue", range] as const,
    clients: ["analytics", "clients"] as const,
    invoices: ["analytics", "invoices"] as const,
  },
};