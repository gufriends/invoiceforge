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
import { Stagger, StaggerItem, FadeIn } from "@/components/animations/fade-in";

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
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            change={overview?.newClientsThisMonth ? overview.newClientsThisMonth * 1 : undefined}
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
      </FadeIn>

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