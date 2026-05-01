# InvoiceForge — TypeScript Types Reference

> **PETUNJUK:** Semua type/interface di file ini adalah SUMBER KEBENARAN (single source of truth). Setiap kali butuh type, AMBIL DARI SINI. Jangan bikin type baru kecuali tidak ada di sini.

---

## Daftar Isi
- [1. Konstanta & Enum](#1-konstanta--enum)
- [2. Database Models (Prisma → TS)](#2-database-models-prisma--ts)
- [3. API Request/Response Types](#3-api-requestresponse-types)
- [4. Form Values Types](#4-form-values-types)
- [5. Component Props Types](#5-component-props-types)
- [6. Hook Return Types](#6-hook-return-types)
- [7. Utility Function Types](#7-utility-function-types)
- [8. Store (Zustand) Types](#8-store-zustand-types)

---

## 1. Konstanta & Enum

### File: `src/lib/constants.ts`
- [ ] Buat file `src/lib/constants.ts`

```ts
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
```

---

## 2. Database Models (Prisma → TS)

### File: `src/types/index.ts`
- [ ] Buat file `src/types/index.ts`
- [ ] Re-export semua type dari sub-file

```ts
export * from "./user";
export * from "./company";
export * from "./client";
export * from "./invoice";
export * from "./payment";
export * from "./analytics";
export * from "./api";
```

### File: `src/types/user.ts`
- [ ] Buat file `src/types/user.ts`

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithCompany extends User {
  company: Company | null;
}

import type { Company } from "./company";
```

### File: `src/types/company.ts`
- [ ] Buat file `src/types/company.ts`

```ts
import type { Currency, InvoiceTemplate } from "@/lib/constants";

export interface Company {
  id: string;
  userId: string;
  name: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  npwp: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  invoicePrefix: string;
  invoiceTemplate: InvoiceTemplate;
  primaryColor: string;
  currency: Currency;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### File: `src/types/client.ts`
- [ ] Buat file `src/types/client.ts`

```ts
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string;
  npwp: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithStats extends Client {
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  lastInvoiceDate: Date | null;
}
```

### File: `src/types/invoice.ts`
- [ ] Buat file `src/types/invoice.ts`

```ts
import type {
  InvoiceStatus,
  DiscountType,
  RecurringCycle,
  InvoiceTemplate,
} from "@/lib/constants";
import type { Client } from "./client";
import type { Payment } from "./payment";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  order: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  paidAmount: number;
  isRecurring: boolean;
  recurringCycle: RecurringCycle | null;
  recurringNext: Date | null;
  template: InvoiceTemplate;
  sentAt: Date | null;
  viewedAt: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceWithRelations extends Invoice {
  client: Client;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceListItem extends Invoice {
  client: Pick<Client, "id" | "name" | "company" | "email">;
  itemCount: number;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
}
```

### File: `src/types/payment.ts`
- [ ] Buat file `src/types/payment.ts`

```ts
import type { PaymentMethod } from "@/lib/constants";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}
```

### File: `src/types/analytics.ts`
- [ ] Buat file `src/types/analytics.ts`

```ts
export interface OverviewStats {
  totalRevenue: number;
  revenueChange: number; // percent
  activeInvoices: number;
  draftInvoices: number;
  activeClients: number;
  newClientsThisMonth: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface RevenueDataPoint {
  period: string; // "2026-01" untuk monthly, "2026-W01" untuk weekly, "2026-01-15" untuk daily
  revenue: number;
  invoiceCount: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  amount: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  amount: number;
}

export interface AgingReport {
  current: number; // 0-30 days
  thirtyDays: number; // 30-60
  sixtyDays: number; // 60-90
  ninetyPlusDays: number; // 90+
}
```

### File: `src/types/api.ts`
- [ ] Buat file `src/types/api.ts`

```ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T> {
  data: T;
}
```

---

## 3. API Request/Response Types

### File: `src/types/api-requests.ts`
- [ ] Buat file `src/types/api-requests.ts`

```ts
import type { InvoiceStatus, DiscountType, RecurringCycle, InvoiceTemplate, PaymentMethod } from "@/lib/constants";

// AUTH
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// CLIENT
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  npwp?: string;
  notes?: string;
}

export type UpdateClientRequest = Partial<CreateClientRequest> & {
  isActive?: boolean;
};

export interface ClientListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "createdAt" | "totalRevenue";
  sortOrder?: "asc" | "desc";
}

// INVOICE
export interface InvoiceItemInput {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  order?: number;
}

export interface CreateInvoiceRequest {
  clientId: string;
  invoiceNumber?: string;
  issueDate: string; // ISO date
  dueDate: string;
  items: InvoiceItemInput[];
  taxRate?: number;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
  terms?: string;
  template?: InvoiceTemplate;
  isRecurring?: boolean;
  recurringCycle?: RecurringCycle;
  status?: InvoiceStatus;
}

export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus | "ALL";
  clientId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "invoiceNumber" | "issueDate" | "dueDate" | "total";
  sortOrder?: "asc" | "desc";
}

// PAYMENT
export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
}

export type UpdatePaymentRequest = Partial<Omit<CreatePaymentRequest, "invoiceId">>;

// COMPANY
export interface UpdateCompanyRequest {
  name?: string;
  logo?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  npwp?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  invoicePrefix?: string;
  invoiceTemplate?: InvoiceTemplate;
  primaryColor?: string;
  currency?: string;
  taxRate?: number;
}

// ANALYTICS
export interface AnalyticsDateRangeQuery {
  startDate?: string;
  endDate?: string;
  granularity?: "daily" | "weekly" | "monthly";
}
```

---

## 4. Form Values Types

### File: `src/types/forms.ts`
- [ ] Buat file `src/types/forms.ts`

```ts
import type { InvoiceTemplate, DiscountType, RecurringCycle, PaymentMethod, Currency } from "@/lib/constants";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  npwp: string;
  notes: string;
  isActive: boolean;
}

export interface InvoiceItemFormValues {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  order: number;
}

export interface InvoiceFormValues {
  invoiceNumber: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  template: InvoiceTemplate;
  items: InvoiceItemFormValues[];
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
  notes: string;
  terms: string;
  isRecurring: boolean;
  recurringCycle: RecurringCycle | null;
}

export interface PaymentFormValues {
  amount: number;
  method: PaymentMethod;
  date: Date;
  reference: string;
  notes: string;
}

export interface CompanyFormValues {
  name: string;
  logo: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  invoicePrefix: string;
  invoiceTemplate: InvoiceTemplate;
  primaryColor: string;
  currency: Currency;
  taxRate: number;
}
```

---

## 5. Component Props Types

### File: `src/types/component-props.ts`
- [ ] Buat file `src/types/component-props.ts`

```ts
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { InvoiceStatus, Currency, InvoiceTemplate } from "@/lib/constants";
import type { InvoiceWithRelations, InvoiceListItem } from "./invoice";
import type { Client, ClientWithStats } from "./client";
import type { Payment } from "./payment";
import type { Company } from "./company";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
  loading?: boolean;
}

export interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md" | "lg";
}

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: Currency;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  presets?: boolean;
  className?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  selection?: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    getRowId: (row: T) => string;
  };
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  bulkActions?: ReactNode;
}

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithRelations;
  onSuccess?: () => void;
}

export interface ClientSelectProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface ItemEditorProps {
  items: InvoiceItemFormValues[];
  onChange: (items: InvoiceItemFormValues[]) => void;
  currency?: Currency;
  disabled?: boolean;
}

export interface InvoicePreviewProps {
  invoice: InvoiceWithRelations;
  company: Company;
  template: InvoiceTemplate;
  className?: string;
}

export interface InvoiceTemplateCardProps {
  template: InvoiceTemplate;
  selected: boolean;
  onSelect: () => void;
}

export interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type: "CREATED" | "SENT" | "VIEWED" | "PAID" | "CANCELLED" | "UPDATED" | "PARTIAL";
  description: string;
  timestamp: Date;
}

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export interface TopbarProps {
  className?: string;
}

import type { InvoiceItemFormValues } from "./forms";
```

---

## 6. Hook Return Types

### File: `src/types/hooks.ts`
- [ ] Buat file `src/types/hooks.ts`

```ts
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { Client, ClientWithStats, ClientListQuery } from "./client";
import type {
  Invoice,
  InvoiceWithRelations,
  InvoiceListItem,
  InvoiceStats,
} from "./invoice";
import type { Payment } from "./payment";
import type { Company } from "./company";
import type { CreateClientRequest, UpdateClientRequest } from "./api-requests";
import type { CreateInvoiceRequest, UpdateInvoiceRequest } from "./api-requests";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "./api-requests";
import type { UpdateCompanyRequest } from "./api-requests";
import type { PaginatedResponse } from "./api";
import type { OverviewStats, RevenueDataPoint } from "./analytics";

export type UseClientsResult = UseQueryResult<PaginatedResponse<ClientWithStats>, Error>;
export type UseClientResult = UseQueryResult<ClientWithStats, Error>;
export type UseCreateClientMutation = UseMutationResult<Client, Error, CreateClientRequest>;
export type UseUpdateClientMutation = UseMutationResult<Client, Error, { id: string; data: UpdateClientRequest }>;
export type UseDeleteClientMutation = UseMutationResult<void, Error, string>;

export type UseInvoicesResult = UseQueryResult<PaginatedResponse<InvoiceListItem>, Error>;
export type UseInvoiceResult = UseQueryResult<InvoiceWithRelations, Error>;
export type UseInvoiceStatsResult = UseQueryResult<InvoiceStats, Error>;
export type UseCreateInvoiceMutation = UseMutationResult<Invoice, Error, CreateInvoiceRequest>;
export type UseUpdateInvoiceMutation = UseMutationResult<Invoice, Error, { id: string; data: UpdateInvoiceRequest }>;
export type UseDeleteInvoiceMutation = UseMutationResult<void, Error, string>;
export type UseSendInvoiceMutation = UseMutationResult<Invoice, Error, string>;

export type UseCreatePaymentMutation = UseMutationResult<Payment, Error, CreatePaymentRequest>;
export type UseUpdatePaymentMutation = UseMutationResult<Payment, Error, { id: string; data: UpdatePaymentRequest }>;
export type UseDeletePaymentMutation = UseMutationResult<void, Error, string>;

export type UseCompanyResult = UseQueryResult<Company, Error>;
export type UseUpdateCompanyMutation = UseMutationResult<Company, Error, UpdateCompanyRequest>;

export type UseOverviewStatsResult = UseQueryResult<OverviewStats, Error>;
export type UseRevenueDataResult = UseQueryResult<RevenueDataPoint[], Error>;
```

---

## 7. Utility Function Types

### File: `src/types/utils.ts`
- [ ] Buat file `src/types/utils.ts`

```ts
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
```

---

## 8. Store (Zustand) Types

### File: `src/types/store.ts`
- [ ] Buat file `src/types/store.ts`

```ts
export interface SidebarStore {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

export interface ThemeStore {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  add: (notification: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}
```

---

## Checklist Akhir
- [ ] `src/lib/constants.ts` selesai
- [ ] `src/types/index.ts` selesai
- [ ] `src/types/user.ts` selesai
- [ ] `src/types/company.ts` selesai
- [ ] `src/types/client.ts` selesai
- [ ] `src/types/invoice.ts` selesai
- [ ] `src/types/payment.ts` selesai
- [ ] `src/types/analytics.ts` selesai
- [ ] `src/types/api.ts` selesai
- [ ] `src/types/api-requests.ts` selesai
- [ ] `src/types/forms.ts` selesai
- [ ] `src/types/component-props.ts` selesai
- [ ] `src/types/hooks.ts` selesai
- [ ] `src/types/utils.ts` selesai
- [ ] `src/types/store.ts` selesai
