"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, FileText, Mail, MapPin, Phone, Receipt, Wallet, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useClient, useClientInvoices } from "@/hooks/use-clients";
import { StatsCard } from "@/components/custom/stats-card";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: client, isLoading } = useClient(id);
  const { data: invoices } = useClientInvoices(id);

  if (isLoading || !client) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.company || "Individual"}</p>
          </div>
          <Badge variant={client.isActive ? "default" : "secondary"}>
            {client.isActive ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          <Button asChild>
            <Link href={`/invoices/create?clientId=${id}`}><FileText className="mr-2 h-4 w-4" /> Buat Invoice</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Invoice" value={client.totalInvoices} icon={Receipt} variant="info" />
        <StatsCard title="Total Pendapatan" value={formatCurrency(client.totalRevenue)} icon={Wallet} variant="success" />
        <StatsCard title="Belum Dibayar" value={formatCurrency(client.outstandingAmount)} icon={Receipt} variant="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div>{client.address}</div>
                  <div>{[client.city, client.province, client.postalCode].filter(Boolean).join(", ")}</div>
                  <div>{client.country}</div>
                </div>
              </div>
            )}
            {client.npwp && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">NPWP</div>
                <div className="font-mono">{client.npwp}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="invoice">
            <TabsList>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="catatan">Catatan</TabsTrigger>
            </TabsList>

            <TabsContent value="invoice">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  {(invoices as any[] | undefined)?.length ? (
                    <div className="space-y-2">
                      {(invoices as any[]).map((inv) => (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{inv.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm">{formatCurrency(inv.total)}</span>
                            <InvoiceStatusBadge status={inv.status} size="sm" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada invoice untuk klien ini</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catatan">
              <Card>
                <CardHeader>
                  <CardTitle>Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                      <StickyNote className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Belum ada catatan untuk klien ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
