"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { Company } from "@/types/company";
import type { UpdateCompanyRequest } from "@/types/api-requests";

export function useCompany() {
  return useQuery({
    queryKey: QUERY_KEYS.company,
    queryFn: () => apiFetch<Company>("/company"),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyRequest) =>
      apiFetch<Company>("/company", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.company });
      toast.success("Pengaturan perusahaan diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}