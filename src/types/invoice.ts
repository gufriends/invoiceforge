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