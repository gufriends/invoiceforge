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
  recurringCycle?: RecurringCycle | null;
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
  sortBy?: "invoiceNumber" | "issueDate" | "dueDate" | "total" | "createdAt";
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