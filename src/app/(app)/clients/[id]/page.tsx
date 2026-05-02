"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, FileText, Mail, MapPin, Phone, Receipt, Wallet, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  const initials = client.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-4 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold">{client.name}</h1>
              <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                {client.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{client.company || "Individual"}</p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${id}/edit`}><Edit className="h-3.5 w-3.5 mr-1.5" /> Edit</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/invoices/create?clientId=${id}`}><FileText className="h-3.5 w-3.5 mr-1.5" /> Buat Invoice</Link>
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard title="Total Invoice" value={client.totalInvoices} icon={Receipt} variant="info" />
        <StatsCard title="Total Pendapatan" value={formatCurrency(client.totalRevenue)} icon={Wallet} variant="success" />
        <StatsCard title="Belum Dibayar" value={formatCurrency(client.outstandingAmount)} icon={Receipt} variant="warning" />
      </div>

      {/* Main body */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Contact card */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium">Kontak & Alamat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <div>{client.address}</div>
                  <div className="text-muted-foreground">
                    {[client.city, client.province, client.postalCode].filter(Boolean).join(", ")}
                  </div>
                  <div className="text-muted-foreground">{client.country}</div>
                </div>
              </div>
            )}
            {client.npwp && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">NPWP</p>
                  <p className="font-mono text-sm mt-0.5">{client.npwp}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs panel */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="invoice">
            <TabsList className="h-8">
              <TabsTrigger value="invoice" className="text-xs">Invoice</TabsTrigger>
              <TabsTrigger value="catatan" className="text-xs">Catatan</TabsTrigger>
            </TabsList>

            <TabsContent value="invoice" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  {(invoices as any[] | undefined)?.length ? (
                    <div>
                      {(invoices as any[]).map((inv, i) => (
                        <div key={inv.id}>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                                <InvoiceStatusBadge status={inv.status} size="sm" />
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{formatDate(inv.issueDate)}</div>
                            </div>
                            <span className="font-mono text-sm font-medium shrink-0">{formatCurrency(inv.total)}</span>
                          </Link>
                          {i < (invoices as any[]).length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Belum ada invoice untuk klien ini
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catatan" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  {client.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <div className="flex flex-col items-center py-8 gap-3 text-center">
                      <StickyNote className="h-8 w-8 text-muted-foreground/40" />
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
