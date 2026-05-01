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