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
  DRAFT:     "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-600",
  SENT:      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  VIEWED:    "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
  PARTIAL:   "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  PAID:      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  OVERDUE:   "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  CANCELLED: "bg-slate-100 text-slate-400 border border-slate-200 line-through dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700",
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

export const INVOICE_TEMPLATE_DETAILS: Record<InvoiceTemplate, { label: string; description: string; thumbnail: string }> = {
  modern: {
    label: "Modern",
    description: "Header bold warna brand, tabel zebra. Cocok startup & agency.",
    thumbnail: "/templates/modern.svg",
  },
  classic: {
    label: "Klasik",
    description: "Formal serif, signature block. Cocok B2B & perusahaan.",
    thumbnail: "/templates/classic.svg",
  },
  minimal: {
    label: "Minimalis",
    description: "Bersih tanpa border, banyak whitespace. Cocok freelancer.",
    thumbnail: "/templates/minimal.svg",
  },
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