"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchPaginated, buildQuery } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { ClientWithStats } from "@/types/client";
import type { Client } from "@/types/client";
import type { CreateClientRequest, UpdateClientRequest, ClientListQuery } from "@/types/api-requests";

export function useClients(query: ClientListQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, query],
    queryFn: () => apiFetchPaginated<ClientWithStats>(`/clients${buildQuery(query as Record<string, unknown>)}`),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.client(id) : ["clients", "none"],
    queryFn: () => apiFetch<ClientWithStats>(`/clients/${id}`),
    enabled: !!id,
  });
}

export function useClientInvoices(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.clientInvoices(id) : ["clients", "none", "invoices"],
    queryFn: () => apiFetch(`/clients/${id}/invoices`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientRequest) =>
      apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      toast.success("Klien berhasil ditambahkan");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      apiFetch<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.client(id) });
      toast.success("Klien berhasil diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      toast.success("Klien berhasil dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
}