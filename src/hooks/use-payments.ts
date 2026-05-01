"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { Payment } from "@/types/payment";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "@/types/api-requests";

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) =>
      apiFetch<Payment>("/payments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(variables.invoiceId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Pembayaran berhasil dicatat");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdatePayment(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentRequest }) =>
      apiFetch<Payment>(`/payments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(invoiceId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      toast.success("Pembayaran diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePayment(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/payments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(invoiceId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      toast.success("Pembayaran dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
}