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