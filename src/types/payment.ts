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