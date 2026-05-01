"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { useCreatePayment } from "@/hooks/use-payments";
import type { PaymentDialogProps } from "@/types/component-props";
import type { PaymentFormValues } from "@/types/forms";

export function PaymentDialog({ open, onOpenChange, invoice, onSuccess }: PaymentDialogProps) {
  const create = useCreatePayment();
  const remaining = Math.max(0, invoice.total - invoice.paidAmount);

  const handleSubmit = async (data: PaymentFormValues) => {
    await create.mutateAsync({
      invoiceId: invoice.id,
      amount: data.amount,
      method: data.method,
      date: data.date.toISOString(),
      reference: data.reference || undefined,
      notes: data.notes || undefined,
    });
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
          <DialogDescription>
            Invoice <span className="font-mono">{invoice.invoiceNumber}</span> · {invoice.client.name}
          </DialogDescription>
        </DialogHeader>
        <PaymentForm
          remainingAmount={remaining}
          onSubmit={handleSubmit}
          loading={create.isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}