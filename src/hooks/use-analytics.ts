"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { OverviewStats, RevenueDataPoint, StatusDistribution, TopClient, PaymentMethodStat, AgingReport } from "@/types/analytics";

export function useOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.overview,
    queryFn: () => apiFetch<OverviewStats>("/analytics/overview"),
  });
}

export function useRevenueData(months: number = 12) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.revenue(`${months}m`),
    queryFn: () => apiFetch<RevenueDataPoint[]>(`/analytics/revenue?months=${months}`),
  });
}

export function useStatusDistribution() {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.invoices,
    queryFn: () => apiFetch<StatusDistribution[]>("/analytics/invoices"),
  });
}

export function useTopClients() {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.clients,
    queryFn: () => apiFetch<TopClient[]>("/analytics/clients"),
  });
}

export function useAgingReport() {
  return useQuery({
    queryKey: ["reports", "aging"] as const,
    queryFn: () => apiFetch<AgingReport>("/reports/aging"),
  });
}