"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import type { InvoiceFormValues } from "@/types/forms";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(id);
  const update = useUpdateInvoice();

  const handleSubmit = async (data: InvoiceFormValues) => {
    await update.mutateAsync({
      id,
      data: {
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
      },
    });
    router.push(`/invoices/${id}`);
  };

  if (isLoading || !invoice) return <FormSkeleton />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/invoices/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
      </div>
      <InvoiceForm
        initialValues={{
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          template: invoice.template as any,
          items: invoice.items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? "",
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            order: it.order,
          })),
          taxRate: invoice.taxRate,
          discountType: (invoice.discountType ?? "PERCENTAGE") as any,
          discountValue: invoice.discountValue,
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
          isRecurring: invoice.isRecurring,
          recurringCycle: invoice.recurringCycle ?? null,
        }}
        onSubmit={handleSubmit}
        loading={update.isPending}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}