"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchPaginated, buildQuery } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { Invoice, InvoiceWithRelations, InvoiceListItem, InvoiceStats } from "@/types/invoice";
import type { CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceListQuery } from "@/types/api-requests";

export function useInvoices(query: InvoiceListQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.invoices, query],
    queryFn: () =>
      apiFetchPaginated<InvoiceListItem>(`/invoices${buildQuery(query as Record<string, unknown>)}`),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.invoice(id) : ["invoices", "none"],
    queryFn: () => apiFetch<InvoiceWithRelations>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: QUERY_KEYS.invoiceStats,
    queryFn: () => apiFetch<InvoiceStats>("/invoices/stats"),
  });
}

export function useNextInvoiceNumber() {
  return useQuery({
    queryKey: QUERY_KEYS.invoiceNumber,
    queryFn: () => apiFetch<{ invoiceNumber: string }>("/invoices/number/next"),
    staleTime: 0,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) =>
      apiFetch<Invoice>("/invoices", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil dibuat");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
      apiFetch<Invoice>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDuplicateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Invoice>(`/invoices/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      toast.success("Invoice berhasil diduplikasi");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Invoice>(`/invoices/${id}/send`, { method: "POST" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
      toast.success("Invoice ditandai terkirim");
    },
    onError: (e) => toast.error(e.message),
  });
}