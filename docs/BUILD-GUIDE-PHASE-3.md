# InvoiceForge — Phase 3: Payments + PDF + Dashboard + Analytics

> **PETUNJUK:** Phase 1 & 2 HARUS sudah 100%. Cek checklist akhir Phase 2.

---

## Daftar Isi
- [Step 1: Payment Service & API](#step-1-payment-service--api)
- [Step 2: Payment Hooks](#step-2-payment-hooks)
- [Step 3: Payment Dialog & Form](#step-3-payment-dialog--form)
- [Step 4: Update Invoice Detail dengan Pembayaran](#step-4-update-invoice-detail-dengan-pembayaran)
- [Step 5: Company Service & API](#step-5-company-service--api)
- [Step 6: Company Hooks & Settings Page](#step-6-company-hooks--settings-page)
- [Step 7: PDF Setup](#step-7-pdf-setup)
- [Step 8: PDF Templates (Modern, Classic, Minimal)](#step-8-pdf-templates-modern-classic-minimal)
- [Step 9: PDF Download Endpoint](#step-9-pdf-download-endpoint)
- [Step 10: Analytics Service & API](#step-10-analytics-service--api)
- [Step 11: Analytics Hooks](#step-11-analytics-hooks)
- [Step 12: Dashboard Page](#step-12-dashboard-page)
- [Step 13: Analytics Page](#step-13-analytics-page)
- [Step 14: Reports Page](#step-14-reports-page)
- [Step 15: Verifikasi](#step-15-verifikasi)

---

## Step 1: Payment Service & API

### File: `src/services/payment.service.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "@/types/api-requests";

async function recalcInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  let status = invoice.status;
  if (totalPaid <= 0) {
    status = invoice.sentAt ? "SENT" : "DRAFT";
    if (invoice.dueDate < new Date() && status === "SENT") status = "OVERDUE";
  } else if (totalPaid >= invoice.total) {
    status = "PAID";
  } else {
    status = "PARTIAL";
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount: totalPaid, status },
  });
}

export const paymentService = {
  async create(userId: string, data: CreatePaymentRequest) {
    const invoice = await prisma.invoice.findFirst({ where: { id: data.invoiceId, userId } });
    if (!invoice) throw new ApiError("INVOICE_NOT_FOUND", "Invoice tidak ditemukan", 404);

    const remaining = invoice.total - invoice.paidAmount;
    if (data.amount > remaining + 0.01) {
      throw new ApiError(
        "AMOUNT_EXCEEDS",
        `Jumlah pembayaran melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`,
        400
      );
    }
    if (data.amount <= 0) {
      throw new ApiError("INVALID_AMOUNT", "Jumlah pembayaran harus lebih dari 0", 400);
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        date: new Date(data.date),
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    await recalcInvoiceStatus(data.invoiceId);
    return payment;
  },

  async update(userId: string, id: string, data: UpdatePaymentRequest) {
    const payment = await prisma.payment.findFirst({
      where: { id, invoice: { userId } },
      include: { invoice: true },
    });
    if (!payment) throw new ApiError("NOT_FOUND", "Pembayaran tidak ditemukan", 404);

    if (typeof data.amount === "number") {
      const otherPaid = payment.invoice.paidAmount - payment.amount;
      const remaining = payment.invoice.total - otherPaid;
      if (data.amount > remaining + 0.01) {
        throw new ApiError(
          "AMOUNT_EXCEEDS",
          `Jumlah pembayaran melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`,
          400
        );
      }
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.method !== undefined ? { method: data.method } : {}),
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(data.reference !== undefined ? { reference: data.reference || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
    });

    await recalcInvoiceStatus(payment.invoiceId);
    return updated;
  },

  async delete(userId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, invoice: { userId } },
    });
    if (!payment) throw new ApiError("NOT_FOUND", "Pembayaran tidak ditemukan", 404);

    await prisma.payment.delete({ where: { id } });
    await recalcInvoiceStatus(payment.invoiceId);
  },
};
```

### File: `src/app/api/payments/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { paymentService } from "@/services/payment.service";
import { paymentSchema } from "@/lib/validations";
import { z } from "zod";

const createSchema = paymentSchema.extend({ invoiceId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, createSchema);
    const payment = await paymentService.create(userId, {
      ...data,
      date: data.date.toISOString(),
      reference: data.reference || undefined,
      notes: data.notes || undefined,
    });
    return jsonResponse(payment, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/payments/[id]/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { paymentService } from "@/services/payment.service";
import { paymentSchema } from "@/lib/validations";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const data = await parseBody(req, paymentSchema.partial());
    const payment = await paymentService.update(userId, id, {
      ...data,
      date: data.date?.toISOString(),
    });
    return jsonResponse(payment);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await paymentService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 2: Payment Hooks

### File: `src/hooks/use-payments.ts`
- [ ] Buat:

```ts
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
```

---

## Step 3: Payment Dialog & Form

### File: `src/components/forms/payment-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/custom/currency-input";
import { paymentSchema } from "@/lib/validations";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format-currency";
import type { PaymentFormValues } from "@/types/forms";

interface Props {
  remainingAmount: number;
  initialValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void | Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export function PaymentForm({ remainingAmount, initialValues, onSubmit, loading, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      method: "BANK_TRANSFER",
      date: new Date(),
      reference: "",
      notes: "",
      ...initialValues,
    },
  });

  const amount = watch("amount");
  const date = watch("date");
  const method = watch("method");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md bg-muted/30 p-3 text-sm">
        <div className="flex justify-between">
          <span>Sisa tagihan:</span>
          <span className="font-mono font-semibold">{formatCurrency(remainingAmount)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Jumlah Pembayaran <span className="text-destructive">*</span></Label>
        <CurrencyInput value={amount} onChange={(v) => setValue("amount", v, { shouldValidate: true })} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        <div className="flex gap-2 text-xs">
          <Button type="button" size="sm" variant="outline" onClick={() => setValue("amount", remainingAmount)}>
            Lunasi semua
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setValue("amount", Math.floor(remainingAmount / 2))}>
            Setengah
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Metode Pembayaran <span className="text-destructive">*</span></Label>
        <Select value={method} onValueChange={(v) => setValue("method", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tanggal Pembayaran <span className="text-destructive">*</span></Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Calendar mode="single" selected={field.value} onSelect={(d) => d && field.onChange(d)} />
              )}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Nomor Referensi</Label>
        <Input id="reference" placeholder="No. transfer / referensi" {...register("reference")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pembayaran
        </Button>
      </div>
    </form>
  );
}
```

### File: `src/components/custom/payment-dialog.tsx`
- [ ] Buat:

```tsx
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
```

---

## Step 4: Update Invoice Detail dengan Pembayaran

### File: `src/components/custom/activity-timeline.tsx`
- [ ] Buat:

```tsx
import { CheckCircle2, FileText, Send, Eye, XCircle, Wallet, Edit3 } from "lucide-react";
import { formatDateTime } from "@/utils/format-date";
import type { ActivityTimelineProps } from "@/types/component-props";

const ICON_MAP = {
  CREATED: FileText,
  SENT: Send,
  VIEWED: Eye,
  PAID: CheckCircle2,
  PARTIAL: Wallet,
  CANCELLED: XCircle,
  UPDATED: Edit3,
} as const;

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>;
  }
  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {events.map((e) => {
        const Icon = ICON_MAP[e.type];
        return (
          <li key={e.id} className="ml-6">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-3 w-3" />
            </span>
            <p className="text-sm font-medium">{e.description}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(e.timestamp)}</p>
          </li>
        );
      })}
    </ol>
  );
}
```

### File: `src/app/(app)/invoices/[id]/page.tsx`
- [ ] REPLACE FILE dari Phase 2 dengan versi lengkap:

```tsx
"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Send, Copy, Download, Wallet, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { useDeletePayment } from "@/hooks/use-payments";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { PaymentDialog } from "@/components/custom/payment-dialog";
import { ActivityTimeline } from "@/components/custom/activity-timeline";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate, formatDateTime } from "@/utils/format-date";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: invoice, isLoading } = useInvoice(id);
  const dup = useDuplicateInvoice();
  const send = useSendInvoice();
  const deletePayment = useDeletePayment(id);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const events = useMemo(() => {
    if (!invoice) return [];
    const items = [];
    items.push({
      id: "created",
      type: "CREATED" as const,
      description: "Invoice dibuat",
      timestamp: new Date(invoice.createdAt),
    });
    if (invoice.sentAt) {
      items.push({ id: "sent", type: "SENT" as const, description: "Invoice ditandai terkirim", timestamp: new Date(invoice.sentAt) });
    }
    if (invoice.viewedAt) {
      items.push({ id: "viewed", type: "VIEWED" as const, description: "Invoice dilihat klien", timestamp: new Date(invoice.viewedAt) });
    }
    invoice.payments.forEach((p) => {
      items.push({
        id: p.id,
        type: invoice.paidAmount >= invoice.total ? "PAID" as const : "PARTIAL" as const,
        description: `Pembayaran ${formatCurrency(p.amount)} via ${PAYMENT_METHOD_LABELS[p.method]}`,
        timestamp: new Date(p.date),
      });
    });
    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [invoice]);

  if (isLoading || !invoice) return <FormSkeleton />;

  const remaining = Math.max(0, invoice.total - invoice.paidAmount);
  const canPay = invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && remaining > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">{invoice.client.name} · {formatDate(invoice.issueDate, "long")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/invoices/${id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          {invoice.status === "DRAFT" && (
            <Button onClick={() => send.mutate(id)}><Send className="mr-2 h-4 w-4" /> Kirim</Button>
          )}
          {canPay && (
            <Button onClick={() => setPaymentOpen(true)}><Wallet className="mr-2 h-4 w-4" /> Catat Pembayaran</Button>
          )}
          <Button variant="outline" onClick={() => dup.mutate(id)}><Copy className="mr-2 h-4 w-4" /> Duplikasi</Button>
          <Button variant="outline" asChild>
            <a href={`/api/invoices/${id}/pdf`} target="_blank"><Download className="mr-2 h-4 w-4" /> PDF</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Detail Invoice</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Klien</div>
                <div className="font-medium">{invoice.client.name}</div>
                {invoice.client.company && <div className="text-sm">{invoice.client.company}</div>}
                <div className="text-sm">{invoice.client.email}</div>
                {invoice.client.phone && <div className="text-sm">{invoice.client.phone}</div>}
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Periode</div>
                <div className="text-sm">Terbit: {formatDate(invoice.issueDate, "long")}</div>
                <div className="text-sm">Jatuh Tempo: {formatDate(invoice.dueDate, "long")}</div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">Item</th>
                    <th className="w-20 p-3 text-right">Qty</th>
                    <th className="w-40 p-3 text-right">Harga</th>
                    <th className="w-40 p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="p-3">
                        <div className="font-medium">{it.name}</div>
                        {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                      </td>
                      <td className="p-3 text-right font-mono">{it.quantity}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto max-w-sm space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">{formatCurrency(invoice.subtotal)}</span></div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground"><span>Diskon</span><span className="font-mono">- {formatCurrency(invoice.discountAmount)}</span></div>
              )}
              <div className="flex justify-between text-sm"><span>PPN ({invoice.taxRate}%)</span><span className="font-mono">{formatCurrency(invoice.taxAmount)}</span></div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>TOTAL</span><span className="font-mono text-primary">{formatCurrency(invoice.total)}</span></div>
              <div className="flex justify-between text-sm text-green-600"><span>Sudah Dibayar</span><span className="font-mono">{formatCurrency(invoice.paidAmount)}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Sisa</span><span className="font-mono">{formatCurrency(remaining)}</span></div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 rounded-md bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground mb-1">Catatan</div>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="mt-3 p-4 rounded-md bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground mb-1">Syarat & Ketentuan</div>
                <p className="text-sm">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Riwayat Pembayaran</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pembayaran</p>
              ) : (
                <ul className="space-y-3">
                  {invoice.payments.map((p) => (
                    <li key={p.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono font-semibold">{formatCurrency(p.amount)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(p.date)} · {PAYMENT_METHOD_LABELS[p.method]}</div>
                          {p.reference && <div className="text-xs font-mono">Ref: {p.reference}</div>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deletePayment.mutate(p.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground mt-2">{p.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aktivitas</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline events={events} />
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} invoice={invoice} />
    </div>
  );
}
```

---

## Step 5: Company Service & API

### File: `src/services/company.service.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { UpdateCompanyRequest } from "@/types/api-requests";

export const companyService = {
  async get(userId: string) {
    let company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError("USER_NOT_FOUND", "User tidak ditemukan", 404);
      company = await prisma.company.create({
        data: { userId, name: `${user.name} Business` },
      });
    }
    return company;
  },

  async update(userId: string, data: UpdateCompanyRequest) {
    return prisma.company.upsert({
      where: { userId },
      create: { userId, name: data.name ?? "Business", ...data } as any,
      update: data as any,
    });
  },
};
```

### File: `src/app/api/company/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { companyService } from "@/services/company.service";
import { companySchema } from "@/lib/validations";

export async function GET() {
  try {
    const userId = await requireAuth();
    const company = await companyService.get(userId);
    return jsonResponse(company);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, companySchema.partial());
    const company = await companyService.update(userId, data);
    return jsonResponse(company);
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 6: Company Hooks & Settings Page

### File: `src/hooks/use-company.ts`
- [ ] Buat:

```ts
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
```

### File: `src/components/forms/company-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companySchema } from "@/lib/validations";
import {
  PROVINCES_ID,
  CURRENCIES,
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_LABELS,
} from "@/lib/constants";
import type { CompanyFormValues } from "@/types/forms";

interface Props {
  initialValues: Partial<CompanyFormValues>;
  onSubmit: (data: CompanyFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function CompanyForm({ initialValues, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      logo: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Indonesia",
      phone: "",
      email: "",
      website: "",
      npwp: "",
      bankName: "",
      bankAccount: "",
      bankHolder: "",
      invoicePrefix: "INV",
      invoiceTemplate: "modern",
      primaryColor: "#2563eb",
      currency: "IDR",
      taxRate: 11,
      ...initialValues,
    },
  });

  const province = watch("province");
  const currency = watch("currency");
  const template = watch("invoiceTemplate");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informasi Perusahaan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nama Perusahaan <span className="text-destructive">*</span></Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="https://..." {...register("website")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" {...register("npwp")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alamat</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" rows={3} {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Kota</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Select value={province || ""} onValueChange={(v) => setValue("province", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {PROVINCES_ID.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos</Label>
            <Input id="postalCode" {...register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Negara</Label>
            <Input id="country" {...register("country")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rekening Bank</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bankName">Nama Bank</Label>
            <Input id="bankName" placeholder="BCA / Mandiri / BNI" {...register("bankName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">No. Rekening</Label>
            <Input id="bankAccount" {...register("bankAccount")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankHolder">Atas Nama</Label>
            <Input id="bankHolder" {...register("bankHolder")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pengaturan Invoice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Prefix Nomor Invoice</Label>
            <Input id="invoicePrefix" {...register("invoicePrefix")} />
            <p className="text-xs text-muted-foreground">Contoh: INV → INV-2026-0001</p>
          </div>
          <div className="space-y-2">
            <Label>Template Default</Label>
            <Select value={template} onValueChange={(v) => setValue("invoiceTemplate", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Uang Default</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">PPN Default (%)</Label>
            <Input id="taxRate" type="number" step="0.1" {...register("taxRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Warna Brand</Label>
            <div className="flex gap-2">
              <Input id="primaryColor" type="color" className="w-16 p-1" {...register("primaryColor")} />
              <Input {...register("primaryColor")} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}
```

### File: `src/app/(app)/settings/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { CompanyForm } from "@/components/forms/company-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCompany, useUpdateCompany } from "@/hooks/use-company";
import type { CompanyFormValues } from "@/types/forms";

export default function SettingsPage() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();

  const handleSubmit = async (data: CompanyFormValues) => {
    await update.mutateAsync(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola profil perusahaan & preferensi invoice</p>
      </div>
      {isLoading || !company ? (
        <FormSkeleton />
      ) : (
        <CompanyForm
          initialValues={{
            name: company.name,
            logo: company.logo ?? "",
            address: company.address ?? "",
            city: company.city ?? "",
            province: company.province ?? "",
            postalCode: company.postalCode ?? "",
            country: company.country,
            phone: company.phone ?? "",
            email: company.email ?? "",
            website: company.website ?? "",
            npwp: company.npwp ?? "",
            bankName: company.bankName ?? "",
            bankAccount: company.bankAccount ?? "",
            bankHolder: company.bankHolder ?? "",
            invoicePrefix: company.invoicePrefix,
            invoiceTemplate: company.invoiceTemplate as any,
            primaryColor: company.primaryColor,
            currency: company.currency as any,
            taxRate: company.taxRate,
          }}
          onSubmit={handleSubmit}
          loading={update.isPending}
        />
      )}
    </div>
  );
}
```

---

## Step 7: PDF Setup

### Common helper untuk PDF
### File: `src/lib/pdf/utils.ts`
- [ ] Buat:

```ts
import { CURRENCY_LOCALES, CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";

export function pdfFormatCurrency(value: number, currency: Currency = "IDR") {
  if (currency === "IDR") return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
  }).format(value);
}

export function pdfFormatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
```

---

## Step 8: PDF Templates (Modern, Classic, Minimal)

### File: `src/lib/pdf/modern-template.tsx`
- [ ] Buat:

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  brand: { fontSize: 28, fontWeight: 700, color: "#2563eb" },
  invoiceMeta: { textAlign: "right" },
  metaRow: { fontSize: 9, marginBottom: 2 },
  invoiceNumber: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 20 },
  twoCol: { flexDirection: "row", gap: 30 },
  col: { flex: 1 },
  label: { fontSize: 8, color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 10, marginBottom: 2 },
  bold: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 8, fontWeight: 700, fontSize: 9 },
  tableRow: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: "#e2e8f0" },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totals: { marginLeft: "auto", width: 220, marginTop: 16 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsBold: { fontWeight: 700, fontSize: 12, color: "#2563eb", borderTopWidth: 1, borderColor: "#0f172a", paddingTop: 6 },
  notes: { marginTop: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  footer: { marginTop: 30, paddingTop: 12, borderTopWidth: 1, borderColor: "#e2e8f0", fontSize: 8, color: "#64748b" },
});

export function ModernInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>INVOICE</Text>
            <Text style={[styles.value, { marginTop: 6, fontWeight: 700 }]}>{company.name}</Text>
            {company.address && <Text style={styles.value}>{company.address}</Text>}
            <Text style={styles.value}>
              {[company.city, company.province, company.postalCode].filter(Boolean).join(", ")}
            </Text>
            {company.phone && <Text style={styles.value}>Telp: {company.phone}</Text>}
            {company.email && <Text style={styles.value}>Email: {company.email}</Text>}
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.metaRow}>Status: {INVOICE_STATUS_LABELS[invoice.status]}</Text>
            <Text style={styles.metaRow}>Tanggal: {pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={styles.metaRow}>Jatuh Tempo: {pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>DITAGIHKAN KEPADA</Text>
          <Text style={[styles.value, styles.bold]}>{invoice.client.name}</Text>
          {invoice.client.company && <Text style={styles.value}>{invoice.client.company}</Text>}
          {invoice.client.address && <Text style={styles.value}>{invoice.client.address}</Text>}
          <Text style={styles.value}>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
          <Text style={styles.value}>{invoice.client.email}</Text>
          {invoice.client.npwp && <Text style={styles.value}>NPWP: {invoice.client.npwp}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text style={styles.bold}>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8, color: "#64748b" }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Diskon</Text>
              <Text>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>PPN ({invoice.taxRate}%)</Text>
            <Text>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsBold]}>
            <Text>TOTAL</Text>
            <Text>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text>
          </View>
        </View>

        {(invoice.notes || invoice.terms || company.bankAccount) && (
          <View style={styles.notes}>
            {company.bankAccount && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>METODE PEMBAYARAN</Text>
                <Text style={styles.value}>{company.bankName} · {company.bankAccount}</Text>
                <Text style={styles.value}>a.n. {company.bankHolder}</Text>
              </View>
            )}
            {invoice.notes && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>CATATAN</Text>
                <Text style={styles.value}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.label}>SYARAT & KETENTUAN</Text>
                <Text style={styles.value}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>Dokumen ini dihasilkan oleh InvoiceForge.</Text>
      </Page>
    </Document>
  );
}
```

### File: `src/lib/pdf/classic-template.tsx`
- [ ] Buat (lebih formal, garis tegas, hitam-putih dengan border tebal):

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: "Times-Roman" },
  title: { textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: 4 },
  subtitle: { textAlign: "center", fontSize: 9, marginBottom: 24, color: "#475569" },
  divider: { borderBottomWidth: 2, marginBottom: 16 },
  section: { marginBottom: 16 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  bold: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#000" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 8, borderBottomWidth: 1, fontWeight: 700, fontSize: 9 },
  tableRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#cbd5e1" },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 240 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { borderTopWidth: 2, marginTop: 4, paddingTop: 6, fontSize: 12, fontWeight: 700 },
  signature: { marginTop: 50, flexDirection: "row", justifyContent: "space-between" },
  signBlock: { textAlign: "center", width: 180 },
});

export function ClassicInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.subtitle}>No. {invoice.invoiceNumber}</Text>
        <View style={styles.divider} />

        <View style={styles.twoCol}>
          <View>
            <Text style={styles.bold}>DARI:</Text>
            <Text style={[styles.bold, { fontSize: 12 }]}>{company.name}</Text>
            {company.address && <Text>{company.address}</Text>}
            <Text>{[company.city, company.province, company.postalCode].filter(Boolean).join(", ")}</Text>
            {company.npwp && <Text>NPWP: {company.npwp}</Text>}
            {company.phone && <Text>Telp: {company.phone}</Text>}
          </View>
          <View>
            <Text style={styles.bold}>UNTUK:</Text>
            <Text style={[styles.bold, { fontSize: 12 }]}>{invoice.client.name}</Text>
            {invoice.client.company && <Text>{invoice.client.company}</Text>}
            {invoice.client.address && <Text>{invoice.client.address}</Text>}
            <Text>{[invoice.client.city, invoice.client.province].filter(Boolean).join(", ")}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <Text>Tanggal Terbit: <Text style={styles.bold}>{pdfFormatDate(invoice.issueDate)}</Text></Text>
          <Text>Jatuh Tempo: <Text style={styles.bold}>{pdfFormatDate(invoice.dueDate)}</Text></Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Deskripsi</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Harga</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text style={styles.bold}>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8 }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.row}><Text>Subtotal</Text><Text>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text></View>
          {invoice.discountAmount > 0 && <View style={styles.row}><Text>Diskon</Text><Text>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text></View>}
          <View style={styles.row}><Text>PPN ({invoice.taxRate}%)</Text><Text>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text></View>
          <View style={[styles.row, styles.grand]}><Text>TOTAL</Text><Text>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text></View>
        </View>

        {company.bankAccount && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.bold}>Pembayaran ditransfer ke:</Text>
            <Text>{company.bankName} {company.bankAccount} a.n. {company.bankHolder}</Text>
          </View>
        )}

        {invoice.notes && <View style={{ marginTop: 12 }}><Text style={styles.bold}>Catatan:</Text><Text>{invoice.notes}</Text></View>}
        {invoice.terms && <View style={{ marginTop: 8 }}><Text style={styles.bold}>Syarat:</Text><Text>{invoice.terms}</Text></View>}

        <View style={styles.signature}>
          <View style={styles.signBlock}>
            <Text>Hormat kami,</Text>
            <Text style={{ marginTop: 50 }}>_______________________</Text>
            <Text style={styles.bold}>{company.name}</Text>
          </View>
          <View style={styles.signBlock}>
            <Text>Diterima oleh,</Text>
            <Text style={{ marginTop: 50 }}>_______________________</Text>
            <Text style={styles.bold}>{invoice.client.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### File: `src/lib/pdf/minimal-template.tsx`
- [ ] Buat (clean, banyak whitespace, no border):

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceWithRelations } from "@/types/invoice";
import type { Company } from "@/types/company";
import { pdfFormatCurrency, pdfFormatDate } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 60, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 50 },
  brand: { fontSize: 16, fontWeight: 700 },
  num: { textAlign: "right" },
  numLabel: { fontSize: 8, color: "#94a3b8", letterSpacing: 1 },
  numValue: { fontSize: 18, fontWeight: 700 },
  block: { marginBottom: 30 },
  small: { fontSize: 8, color: "#94a3b8", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  table: { marginBottom: 20 },
  th: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#1e293b" },
  td: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#e2e8f0" },
  colItem: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  totalsLabel: { width: 120, textAlign: "right", marginRight: 10 },
  totalsValue: { width: 120, textAlign: "right" },
  grand: { fontSize: 14, fontWeight: 700, marginTop: 8 },
});

export function MinimalInvoicePDF({ invoice, company }: { invoice: InvoiceWithRelations; company: Company }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>{company.name}</Text>
            {company.email && <Text style={{ fontSize: 9, color: "#64748b" }}>{company.email}</Text>}
          </View>
          <View style={styles.num}>
            <Text style={styles.numLabel}>INVOICE</Text>
            <Text style={styles.numValue}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={[styles.block, { flexDirection: "row", gap: 40 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>Untuk</Text>
            <Text style={{ fontWeight: 700 }}>{invoice.client.name}</Text>
            {invoice.client.company && <Text>{invoice.client.company}</Text>}
            <Text style={{ fontSize: 9, color: "#64748b" }}>{invoice.client.email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>Tanggal</Text>
            <Text>{pdfFormatDate(invoice.issueDate)}</Text>
            <Text style={[styles.small, { marginTop: 8 }]}>Jatuh Tempo</Text>
            <Text>{pdfFormatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.small, styles.colItem]}>Item</Text>
            <Text style={[styles.small, styles.colQty]}>Qty</Text>
            <Text style={[styles.small, styles.colPrice]}>Harga</Text>
            <Text style={[styles.small, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((it) => (
            <View key={it.id} style={styles.td}>
              <View style={styles.colItem}>
                <Text>{it.name}</Text>
                {it.description && <Text style={{ fontSize: 8, color: "#94a3b8" }}>{it.description}</Text>}
              </View>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colPrice}>{pdfFormatCurrency(it.unitPrice, company.currency as any)}</Text>
              <Text style={styles.colTotal}>{pdfFormatCurrency(it.total, company.currency as any)}</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.subtotal, company.currency as any)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Diskon</Text>
              <Text style={styles.totalsValue}>- {pdfFormatCurrency(invoice.discountAmount, company.currency as any)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>PPN {invoice.taxRate}%</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.taxAmount, company.currency as any)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grand]}>
            <Text style={styles.totalsLabel}>Total</Text>
            <Text style={styles.totalsValue}>{pdfFormatCurrency(invoice.total, company.currency as any)}</Text>
          </View>
        </View>

        {company.bankAccount && (
          <View style={{ marginTop: 40 }}>
            <Text style={styles.small}>Pembayaran ke</Text>
            <Text>{company.bankName} · {company.bankAccount}</Text>
            <Text style={{ fontSize: 9 }}>a.n. {company.bankHolder}</Text>
          </View>
        )}

        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.small}>Catatan</Text>
            <Text style={{ fontSize: 9 }}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
```

---

## Step 9: PDF Download Endpoint

### File: `src/app/api/invoices/[id]/pdf/route.ts`
- [ ] Buat:

```ts
import { renderToBuffer } from "@react-pdf/renderer";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { companyService } from "@/services/company.service";
import { ModernInvoicePDF } from "@/lib/pdf/modern-template";
import { ClassicInvoicePDF } from "@/lib/pdf/classic-template";
import { MinimalInvoicePDF } from "@/lib/pdf/minimal-template";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const [invoice, company] = await Promise.all([
      invoiceService.getById(userId, id),
      companyService.get(userId),
    ]);

    const pdfDoc = (() => {
      switch (invoice.template) {
        case "classic": return <ClassicInvoicePDF invoice={invoice as any} company={company as any} />;
        case "minimal": return <MinimalInvoicePDF invoice={invoice as any} company={company as any} />;
        default: return <ModernInvoicePDF invoice={invoice as any} company={company as any} />;
      }
    })();

    const buffer = await renderToBuffer(pdfDoc);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 10: Analytics Service & API

### File: `src/services/analytics.service.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";

export const analyticsService = {
  async overview(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisMonth = startOfMonth;

    const [thisMonth, prevMonth, activeInvoices, draftInvoices, activeClients, newClientsThisMonth, overdue] = await Promise.all([
      prisma.payment.aggregate({
        where: { invoice: { userId }, date: { gte: startOfThisMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: { userId },
          date: { gte: startOfPrevMonth, lt: startOfThisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { userId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.invoice.count({ where: { userId, status: "DRAFT" } }),
      prisma.client.count({ where: { userId, isActive: true } }),
      prisma.client.count({ where: { userId, createdAt: { gte: startOfThisMonth } } }),
      prisma.invoice.aggregate({
        where: { userId, status: "OVERDUE" },
        _sum: { total: true, paidAmount: true },
        _count: { _all: true },
      }),
    ]);

    const thisMonthRev = thisMonth._sum?.amount ?? 0;
    const prevMonthRev = prevMonth._sum?.amount ?? 0;
    const revenueChange = prevMonthRev === 0 ? (thisMonthRev > 0 ? 100 : 0) : ((thisMonthRev - prevMonthRev) / prevMonthRev) * 100;
    const overdueAmount = (overdue._sum?.total ?? 0) - (overdue._sum?.paidAmount ?? 0);

    return {
      totalRevenue: thisMonthRev,
      revenueChange: Math.round(revenueChange * 10) / 10,
      activeInvoices,
      draftInvoices,
      activeClients,
      newClientsThisMonth,
      overdueCount: overdue._count?._all ?? 0,
      overdueAmount,
    };
  },

  async revenueByMonth(userId: string, months: number = 12) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const payments = await prisma.payment.findMany({
      where: { invoice: { userId }, date: { gte: start } },
      select: { amount: true, date: true, invoiceId: true },
    });

    const byMonth = new Map<string, { revenue: number; invoiceIds: Set<string> }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, { revenue: 0, invoiceIds: new Set() });
    }
    payments.forEach((p) => {
      const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = byMonth.get(key);
      if (entry) {
        entry.revenue += p.amount;
        entry.invoiceIds.add(p.invoiceId);
      }
    });

    return Array.from(byMonth.entries()).map(([period, { revenue, invoiceIds }]) => ({
      period,
      revenue: Math.round(revenue),
      invoiceCount: invoiceIds.size,
    }));
  },

  async statusDistribution(userId: string) {
    const grouped = await prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
      _sum: { total: true },
    });
    return grouped.map((g) => ({
      status: g.status,
      count: g._count?._all ?? 0,
      amount: g._sum?.total ?? 0,
    }));
  },

  async topClients(userId: string, limit: number = 5) {
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        invoices: {
          select: { paidAmount: true, status: true },
        },
      },
    });

    return clients
      .map((c) => ({
        clientId: c.id,
        clientName: c.name,
        invoiceCount: c.invoices.length,
        totalRevenue: c.invoices.reduce(
          (sum, inv) => (inv.status === "PAID" || inv.status === "PARTIAL" ? sum + inv.paidAmount : sum),
          0
        ),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  async paymentMethods(userId: string) {
    const payments = await prisma.payment.groupBy({
      by: ["method"],
      where: { invoice: { userId } },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return payments.map((p) => ({
      method: p.method,
      count: p._count?._all ?? 0,
      amount: p._sum?.amount ?? 0,
    }));
  },

  async aging(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { userId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      select: { total: true, paidAmount: true, dueDate: true },
    });
    const now = new Date();
    const buckets = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlusDays: 0 };
    invoices.forEach((inv) => {
      const outstanding = inv.total - inv.paidAmount;
      if (outstanding <= 0) return;
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 0) buckets.current += outstanding;
      else if (daysOverdue <= 30) buckets.thirtyDays += outstanding;
      else if (daysOverdue <= 60) buckets.sixtyDays += outstanding;
      else buckets.ninetyPlusDays += outstanding;
    });
    return buckets;
  },
};
```

### File: `src/app/api/analytics/overview/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await analyticsService.overview(userId);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/analytics/revenue/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const months = Math.min(36, Math.max(1, Number(searchParams.get("months") ?? "12")));
    const data = await analyticsService.revenueByMonth(userId, months);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/analytics/invoices/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await analyticsService.statusDistribution(userId);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/analytics/clients/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await analyticsService.topClients(userId);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/reports/aging/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await analyticsService.aging(userId);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 11: Analytics Hooks

### File: `src/hooks/use-analytics.ts`
- [ ] Buat:

```ts
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
```

---

## Step 12: Dashboard Page

### File: `src/components/charts/revenue-chart.tsx`
- [ ] Buat:

```tsx
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/utils/format-currency";
import type { RevenueDataPoint } from "@/types/analytics";

const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  const formatted = data.map((d) => {
    const [y, m] = d.period.split("-");
    return { ...d, label: `${monthsID[Number(m) - 1]} ${y.slice(2)}` };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })} />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), "Pendapatan"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#rev)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### File: `src/components/charts/status-distribution.tsx`
- [ ] Buat:

```tsx
"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { StatusDistribution } from "@/types/analytics";

const COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SENT: "#3b82f6",
  VIEWED: "#06b6d4",
  PARTIAL: "#f59e0b",
  PAID: "#22c55e",
  OVERDUE: "#ef4444",
  CANCELLED: "#cbd5e1",
};

export function StatusDistributionChart({ data }: { data: StatusDistribution[] }) {
  const formatted = data.map((d) => ({
    name: INVOICE_STATUS_LABELS[d.status as keyof typeof INVOICE_STATUS_LABELS] ?? d.status,
    value: d.count,
    fill: COLORS[d.status] ?? "#94a3b8",
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {formatted.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### File: `src/components/charts/top-clients-chart.tsx`
- [ ] Buat:

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/utils/format-currency";
import type { TopClient } from "@/types/analytics";

export function TopClientsChart({ data }: { data: TopClient[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })} fontSize={11} />
        <YAxis type="category" dataKey="clientName" width={120} fontSize={11} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey="totalRevenue" fill="#7c3aed" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### File: `src/app/(app)/dashboard/page.tsx`
- [ ] Buat dengan EXACT layout:

```tsx
"use client";

import Link from "next/link";
import { Wallet, FileText, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/custom/stats-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { useOverview, useRevenueData } from "@/hooks/use-analytics";
import { useInvoices } from "@/hooks/use-invoices";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate, formatDateRelative } from "@/utils/format-date";

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const { data: revenue } = useRevenueData(12);
  const { data: recent } = useInvoices({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const { data: upcoming } = useInvoices({ limit: 5, status: "SENT", sortBy: "dueDate", sortOrder: "asc" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang kembali. Berikut ringkasan bisnis kamu.</p>
      </div>

      {/* Stats cards (4 kolom) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pendapatan Bulan Ini"
          value={loadingOverview ? "..." : formatCurrency(overview?.totalRevenue ?? 0)}
          change={overview?.revenueChange}
          changeLabel="dari bulan lalu"
          icon={Wallet}
          variant="success"
          loading={loadingOverview}
        />
        <StatsCard
          title="Invoice Aktif"
          value={loadingOverview ? "..." : (overview?.activeInvoices ?? 0)}
          changeLabel={`${overview?.draftInvoices ?? 0} draft`}
          icon={FileText}
          variant="info"
          loading={loadingOverview}
        />
        <StatsCard
          title="Klien Aktif"
          value={loadingOverview ? "..." : (overview?.activeClients ?? 0)}
          change={overview?.newClientsThisMonth ? overview.newClientsThisMonth * 1 : undefined}
          changeLabel="baru bulan ini"
          icon={Users}
          variant="default"
          loading={loadingOverview}
        />
        <StatsCard
          title="Jatuh Tempo"
          value={loadingOverview ? "..." : (overview?.overdueCount ?? 0)}
          changeLabel={formatCurrency(overview?.overdueAmount ?? 0, "IDR", { compact: true })}
          icon={AlertTriangle}
          variant="warning"
          loading={loadingOverview}
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pendapatan 12 Bulan Terakhir</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {revenue && revenue.length > 0 ? (
            <RevenueChart data={revenue} />
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              Belum ada data pendapatan
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Terbaru</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">Lihat semua <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recent?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada invoice</p>}
            {recent?.data.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-md p-3 hover:bg-muted/50">
                <div>
                  <div className="font-mono text-sm font-medium">{inv.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">{inv.client.name} · {formatDate(inv.issueDate)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{formatCurrency(inv.total)}</span>
                  <InvoiceStatusBadge status={inv.status} size="sm" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akan Jatuh Tempo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(upcoming?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Tidak ada invoice yang akan jatuh tempo</p>}
            {upcoming?.data.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-md p-3 hover:bg-muted/50">
                <div>
                  <div className="font-mono text-sm font-medium">{inv.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">{inv.client.name} · {formatDateRelative(inv.dueDate)}</div>
                </div>
                <span className="font-mono text-sm">{formatCurrency(inv.total)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Step 13: Analytics Page

### File: `src/components/charts/payment-method-chart.tsx`
- [ ] Buat:

```tsx
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { PaymentMethodStat } from "@/types/analytics";

const COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#94a3b8"];

export function PaymentMethodChart({ data }: { data: PaymentMethodStat[] }) {
  const formatted = data.map((d, i) => ({
    name: PAYMENT_METHOD_LABELS[d.method as keyof typeof PAYMENT_METHOD_LABELS] ?? d.method,
    value: d.amount,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" outerRadius={90}>
          {formatted.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### File: `src/app/(app)/analytics/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatusDistributionChart } from "@/components/charts/status-distribution";
import { TopClientsChart } from "@/components/charts/top-clients-chart";
import {
  useRevenueData,
  useStatusDistribution,
  useTopClients,
} from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data: revenue } = useRevenueData(12);
  const { data: statuses } = useStatusDistribution();
  const { data: topClients } = useTopClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analitik</h1>
        <p className="text-sm text-muted-foreground">Insight bisnis kamu dalam grafik</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Pendapatan 12 Bulan</CardTitle></CardHeader>
        <CardContent>
          {revenue ? <RevenueChart data={revenue} /> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Distribusi Status Invoice</CardTitle></CardHeader>
          <CardContent>
            {statuses ? <StatusDistributionChart data={statuses} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top 5 Klien</CardTitle></CardHeader>
          <CardContent>
            {topClients ? <TopClientsChart data={topClients} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Step 14: Reports Page

### File: `src/app/api/reports/income/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const payments = await prisma.payment.findMany({
      where: {
        invoice: { userId },
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        invoice: { select: { invoiceNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return jsonResponse({ payments, total });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/reports/tax/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ["PAID", "PARTIAL"] },
        ...(startDate || endDate
          ? {
              issueDate: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      select: {
        invoiceNumber: true,
        issueDate: true,
        subtotal: true,
        taxRate: true,
        taxAmount: true,
        total: true,
        client: { select: { name: true, npwp: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const totalDPP = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    return jsonResponse({ invoices, totalTax, totalDPP });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/(app)/reports/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import { Download, Wallet, Receipt, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgingReport } from "@/hooks/use-analytics";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import { exportCsv } from "@/utils/export-csv";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

function useIncomeReport() {
  return useQuery({
    queryKey: ["reports", "income"],
    queryFn: () => apiFetch<{ payments: any[]; total: number }>("/reports/income"),
  });
}

function useTaxReport() {
  return useQuery({
    queryKey: ["reports", "tax"],
    queryFn: () => apiFetch<{ invoices: any[]; totalTax: number; totalDPP: number }>("/reports/tax"),
  });
}

export default function ReportsPage() {
  const { data: income } = useIncomeReport();
  const { data: tax } = useTaxReport();
  const { data: aging } = useAgingReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-sm text-muted-foreground">Laporan keuangan & tagihan</p>
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income"><Wallet className="mr-2 h-4 w-4" /> Pendapatan</TabsTrigger>
          <TabsTrigger value="tax"><Receipt className="mr-2 h-4 w-4" /> PPN</TabsTrigger>
          <TabsTrigger value="aging"><AlertCircle className="mr-2 h-4 w-4" /> Aging</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Laporan Pendapatan</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!income) return;
                  exportCsv(
                    income.payments.map((p) => ({
                      tanggal: formatDate(p.date),
                      invoice: p.invoice.invoiceNumber,
                      klien: p.invoice.client.name,
                      metode: PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS],
                      jumlah: p.amount,
                    })),
                    "laporan-pendapatan.csv",
                    [
                      { key: "tanggal", label: "Tanggal" },
                      { key: "invoice", label: "Invoice" },
                      { key: "klien", label: "Klien" },
                      { key: "metode", label: "Metode" },
                      { key: "jumlah", label: "Jumlah" },
                    ]
                  );
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-md bg-muted/30 p-4">
                <div className="text-xs uppercase text-muted-foreground">Total Pendapatan</div>
                <div className="text-2xl font-bold font-mono">{formatCurrency(income?.total ?? 0)}</div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-left">Klien</th>
                      <th className="p-3 text-left">Metode</th>
                      <th className="p-3 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {income?.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="p-3">{formatDate(p.date)}</td>
                        <td className="p-3 font-mono">{p.invoice.invoiceNumber}</td>
                        <td className="p-3">{p.invoice.client.name}</td>
                        <td className="p-3">{PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS]}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader><CardTitle>Laporan PPN</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="rounded-md bg-muted/30 p-4">
                  <div className="text-xs uppercase text-muted-foreground">Total DPP</div>
                  <div className="text-2xl font-bold font-mono">{formatCurrency(tax?.totalDPP ?? 0)}</div>
                </div>
                <div className="rounded-md bg-primary/10 p-4">
                  <div className="text-xs uppercase text-primary">Total PPN</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(tax?.totalTax ?? 0)}</div>
                </div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-left">Klien</th>
                      <th className="p-3 text-right">DPP</th>
                      <th className="p-3 text-right">PPN</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tax?.invoices.map((inv: any, i: number) => (
                      <tr key={i}>
                        <td className="p-3">{formatDate(inv.issueDate)}</td>
                        <td className="p-3 font-mono">{inv.invoiceNumber}</td>
                        <td className="p-3">{inv.client.name}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(inv.subtotal)}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(inv.taxAmount)}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader><CardTitle>Aging Piutang</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-md border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Belum Jatuh Tempo</div>
                  <div className="text-xl font-bold font-mono">{formatCurrency(aging?.current ?? 0)}</div>
                </div>
                <div className="rounded-md border bg-yellow-50 dark:bg-yellow-900/20 p-4">
                  <div className="text-xs uppercase text-yellow-700 dark:text-yellow-400">1 - 30 hari</div>
                  <div className="text-xl font-bold font-mono">{formatCurrency(aging?.thirtyDays ?? 0)}</div>
                </div>
                <div className="rounded-md border bg-orange-50 dark:bg-orange-900/20 p-4">
                  <div className="text-xs uppercase text-orange-700 dark:text-orange-400">31 - 60 hari</div>
                  <div className="text-xl font-bold font-mono">{formatCurrency(aging?.sixtyDays ?? 0)}</div>
                </div>
                <div className="rounded-md border bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="text-xs uppercase text-red-700 dark:text-red-400">60+ hari</div>
                  <div className="text-xl font-bold font-mono">{formatCurrency(aging?.ninetyPlusDays ?? 0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Step 15: Verifikasi

- [ ] Login `budi@invoiceforge.id` / `Password123!`
- [ ] Navigasi ke `/dashboard`:
  - [ ] 4 stats card tampil
  - [ ] Revenue chart 12 bulan tampil
  - [ ] List "Invoice Terbaru" & "Akan Jatuh Tempo" tampil
- [ ] Buka invoice DRAFT → klik "Kirim" → status berubah ke SENT
- [ ] Buka invoice SENT → klik "Catat Pembayaran":
  - [ ] Dialog terbuka dengan sisa tagihan benar
  - [ ] Submit setengah → status berubah ke PARTIAL
  - [ ] Catat lagi sisanya → status PAID
- [ ] Coba record payment > sisa → muncul error "Jumlah pembayaran melebihi sisa tagihan"
- [ ] Klik "PDF" di detail invoice → buka tab baru, PDF ter-render
- [ ] Coba 3 template (Modern, Classic, Minimal) via Edit → ganti template → simpan → lihat PDF
- [ ] Navigasi ke `/settings`:
  - [ ] Form perusahaan tampil dengan data dari seed
  - [ ] Update `taxRate` ke 12 → save → cek di buat invoice baru, default tax 12
- [ ] Navigasi ke `/analytics`:
  - [ ] 3 chart tampil
- [ ] Navigasi ke `/reports`:
  - [ ] Tab "Pendapatan" tampil daftar pembayaran
  - [ ] Klik "Export CSV" → file download
  - [ ] Tab "PPN" tampil DPP & PPN
  - [ ] Tab "Aging" tampil 4 bucket

---

## Checklist Akhir Phase 3

- [ ] Payment service & API selesai
- [ ] Invoice status auto-recalculate setelah pembayaran
- [ ] Payment dialog & form bekerja
- [ ] Activity timeline tampil di invoice detail
- [ ] Company service & settings page selesai
- [ ] 3 PDF template (Modern, Classic, Minimal) selesai
- [ ] PDF download endpoint berfungsi
- [ ] Analytics service (overview, revenue, status, top clients, aging) selesai
- [ ] 3 chart (revenue, status pie, top clients bar) selesai
- [ ] Dashboard page tampil 4 stats + chart + 2 list
- [ ] Analytics page tampil 3 chart
- [ ] Reports page (income, tax, aging) selesai
- [ ] CSV export berfungsi
- [ ] Tidak ada error TypeScript (`npm run build` sukses)
- [ ] **SIAP LANJUT KE PHASE 4** ✅
