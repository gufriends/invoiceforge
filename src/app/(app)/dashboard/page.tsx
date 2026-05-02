"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Wallet, FileText, Users, AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/custom/stats-card";
import { ChartSkeleton } from "@/components/custom/loading-skeleton";
import { useOverview, useRevenueData } from "@/hooks/use-analytics";
import { useInvoices } from "@/hooks/use-invoices";
import type { InvoiceListItem } from "@/types/invoice";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate, formatDateRelative } from "@/utils/format-date";
import { Stagger, StaggerItem, FadeIn } from "@/components/animations/fade-in";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const { data: revenue } = useRevenueData(12);
  const { data: recent } = useInvoices({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const { data: upcoming } = useInvoices({ limit: 5, status: "SENT", sortBy: "dueDate", sortOrder: "asc" });

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan aktivitas bisnis kamu.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/invoices/create">
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Invoice
          </Link>
        </Button>
      </div>

      {/* KPI strip */}
      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatsCard
            title="Pendapatan Bulan Ini"
            value={loadingOverview ? "..." : formatCurrency(overview?.totalRevenue ?? 0)}
            change={overview?.revenueChange}
            changeLabel="dari bulan lalu"
            icon={Wallet}
            variant="success"
            loading={loadingOverview}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCard
            title="Invoice Aktif"
            value={loadingOverview ? "..." : (overview?.activeInvoices ?? 0)}
            changeLabel={`${overview?.draftInvoices ?? 0} draft`}
            icon={FileText}
            variant="info"
            loading={loadingOverview}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCard
            title="Klien Aktif"
            value={loadingOverview ? "..." : (overview?.activeClients ?? 0)}
            change={overview?.newClientsThisMonth ?? undefined}
            changeLabel="baru bulan ini"
            icon={Users}
            variant="default"
            loading={loadingOverview}
          />
        </StaggerItem>
        <StaggerItem>
          <StatsCard
            title="Jatuh Tempo"
            value={loadingOverview ? "..." : (overview?.overdueCount ?? 0)}
            changeLabel={formatCurrency(overview?.overdueAmount ?? 0, "IDR", { compact: true })}
            icon={AlertTriangle}
            variant="warning"
            loading={loadingOverview}
          />
        </StaggerItem>
      </Stagger>

      {/* Revenue chart */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendapatan 12 Bulan Terakhir</CardTitle>
            <CardDescription>Tren pendapatan invoice yang dibayar</CardDescription>
          </CardHeader>
          <CardContent>
            {revenue && revenue.length > 0 ? (
              <RevenueChart data={revenue} />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data pendapatan
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Recent + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Invoice Terbaru */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Invoice Terbaru</CardTitle>
              <CardDescription>5 invoice terakhir dibuat</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
              <Link href="/invoices">
                Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(recent?.data ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada invoice
              </div>
            ) : (
              <div>
                {recent?.data.map((inv: InvoiceListItem, i: number) => (
                  <div key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                          {inv.client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                          <InvoiceStatusBadge status={inv.status} size="sm" />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {inv.client.name} · {formatDate(inv.issueDate)}
                        </div>
                      </div>
                      <span className="font-mono text-sm font-medium shrink-0">{formatCurrency(inv.total)}</span>
                    </Link>
                    {i < (recent?.data.length ?? 0) - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Akan Jatuh Tempo */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Akan Jatuh Tempo</CardTitle>
              <CardDescription>Invoice yang perlu segera ditagih</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
              <Link href="/invoices?status=SENT">
                Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(upcoming?.data ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Tidak ada invoice yang akan jatuh tempo
              </div>
            ) : (
              <div>
                {upcoming?.data.map((inv: InvoiceListItem, i: number) => (
                  <div key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-warning/10 text-warning font-medium">
                          {inv.client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-medium">{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {inv.client.name} · <span className="text-warning">{formatDateRelative(inv.dueDate)}</span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-medium shrink-0">{formatCurrency(inv.total)}</span>
                    </Link>
                    {i < (upcoming?.data.length ?? 0) - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
