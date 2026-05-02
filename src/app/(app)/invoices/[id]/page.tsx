"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Send, Copy, Download, Wallet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { useDeletePayment } from "@/hooks/use-payments";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { PaymentDialog } from "@/components/custom/payment-dialog";
import { ActivityTimeline } from "@/components/custom/activity-timeline";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
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
    <div className="space-y-4 max-w-screen-xl">
      {/* Sticky header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-semibold">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{invoice.client.name} · {formatDate(invoice.issueDate, "long")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/${id}/edit`}><Edit className="h-3.5 w-3.5 mr-1.5" /> Edit</Link>
          </Button>
          {invoice.status === "DRAFT" && (
            <Button size="sm" onClick={() => send.mutate(id)}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Kirim
            </Button>
          )}
          {canPay && (
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              <Wallet className="h-3.5 w-3.5 mr-1.5" /> Catat Pembayaran
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => dup.mutate(id)}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplikasi
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/invoices/${id}/pdf`} target="_blank">
              <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
            </a>
          </Button>
        </div>
      </div>

      {/* Main body — 8+4 grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Client + period info */}
          <Card>
            <CardContent className="pt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Klien</p>
                <p className="font-medium text-sm">{invoice.client.name}</p>
                {invoice.client.company && <p className="text-sm text-muted-foreground">{invoice.client.company}</p>}
                <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                {invoice.client.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Periode</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                  <span className="text-muted-foreground">Terbit</span>
                  <span>{formatDate(invoice.issueDate, "long")}</span>
                  <span className="text-muted-foreground">Jatuh Tempo</span>
                  <span>{formatDate(invoice.dueDate, "long")}</span>
                  {invoice.isRecurring && invoice.recurringCycle && (
                    <>
                      <span className="text-muted-foreground">Recurring</span>
                      <span className="capitalize">{invoice.recurringCycle.toLowerCase()}</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items table */}
          <Card>
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Item</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="text-xs font-medium pl-4">Deskripsi</TableHead>
                    <TableHead className="text-xs font-medium text-right w-16">Qty</TableHead>
                    <TableHead className="text-xs font-medium text-right w-36 hidden sm:table-cell">Harga</TableHead>
                    <TableHead className="text-xs font-medium text-right w-36 pr-4">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((it) => (
                    <TableRow key={it.id} className="h-10">
                      <TableCell className="pl-4">
                        <div className="font-medium text-sm">{it.name}</div>
                        {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{it.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{formatCurrency(it.unitPrice)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium pr-4">{formatCurrency(it.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="px-4 py-3 border-t ml-auto max-w-xs w-full space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diskon</span>
                    <span className="font-mono text-destructive">– {formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PPN ({invoice.taxRate}%)</span>
                  <span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="font-mono text-primary">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Sudah Dibayar</span>
                  <span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Sisa Tagihan</span>
                  <span className="font-mono">{formatCurrency(remaining)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {invoice.notes && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">Catatan</p>
                    <p className="text-sm">{invoice.notes}</p>
                  </CardContent>
                </Card>
              )}
              {invoice.terms && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">Syarat & Ketentuan</p>
                    <p className="text-sm">{invoice.terms}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Payment history */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada pembayaran</p>
              ) : (
                invoice.payments.map((p) => (
                  <div key={p.id} className="rounded-md border px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold">{formatCurrency(p.amount)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatDate(p.date)} · {PAYMENT_METHOD_LABELS[p.method]}
                        </div>
                        {p.reference && <div className="text-xs font-mono text-muted-foreground">Ref: {p.reference}</div>}
                        {p.notes && <div className="text-xs text-muted-foreground mt-0.5">{p.notes}</div>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePayment.mutate(p.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Aktivitas</CardTitle>
            </CardHeader>
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
