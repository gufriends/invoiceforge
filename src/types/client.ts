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