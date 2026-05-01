"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCreateInvoice, useNextInvoiceNumber } from "@/hooks/use-invoices";
import type { InvoiceFormValues } from "@/types/forms";

export default function CreateInvoicePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetClientId = sp.get("clientId") ?? "";
  const { data: nextNum, isLoading } = useNextInvoiceNumber();
  const create = useCreateInvoice();

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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat Invoice</h1>
          <p className="text-sm text-muted-foreground">Isi detail invoice di bawah</p>
        </div>
      </div>
      {isLoading ? (
        <FormSkeleton />
      ) : (
        <InvoiceForm
          initialValues={{
            invoiceNumber: nextNum?.invoiceNumber ?? "",
            clientId: presetClientId,
          }}
          onSubmit={handleSubmit}
          loading={create.isPending}
          submitLabel="Simpan Invoice"
        />
      )}
    </div>
  );
}