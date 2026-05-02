"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCreateInvoice, useNextInvoiceNumber } from "@/hooks/use-invoices";
import { useCompany } from "@/hooks/use-company";
import type { InvoiceFormValues } from "@/types/forms";

export default function CreateInvoicePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetClientId = sp.get("clientId") ?? "";
  const { data: nextNum, isLoading: loadingNum } = useNextInvoiceNumber();
  const { data: company, isLoading: loadingCompany } = useCompany();
  const create = useCreateInvoice();
  const isLoading = loadingNum || loadingCompany;

  const handleSubmit = async (data: InvoiceFormValues) => {
    const invoice = await create.mutateAsync({
      ...data,
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      items: data.items.map((it, idx) => ({
        name: it.name,
        description: it.description || undefined,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        order: idx,
      })),
    });
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-4 max-w-screen-lg">
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Buat Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Isi detail invoice di bawah.</p>
        </div>
      </div>
      {isLoading ? (
        <FormSkeleton />
      ) : (
        <InvoiceForm
          initialValues={{
            invoiceNumber: nextNum?.invoiceNumber ?? "",
            clientId: presetClientId,
            template: (company?.invoiceTemplate as any) ?? "modern",
          }}
          onSubmit={handleSubmit}
          loading={create.isPending}
          submitLabel="Simpan Invoice"
        />
      )}
    </div>
  );
}