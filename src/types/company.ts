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