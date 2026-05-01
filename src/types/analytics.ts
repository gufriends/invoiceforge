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