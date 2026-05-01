"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatusDistributionChart } from "@/components/charts/status-distribution";
import { TopClientsChart } from "@/components/charts/top-clients-chart";
import { ChartSkeleton } from "@/components/custom/loading-skeleton";
import { EmptyState } from "@/components/custom/empty-state";
import { BarChart3 } from "lucide-react";
import {
  useRevenueData,
  useStatusDistribution,
  useTopClients,
} from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data: revenue, isLoading: loadingRevenue } = useRevenueData(12);
  const { data: statuses, isLoading: loadingStatuses } = useStatusDistribution();
  const { data: topClients, isLoading: loadingTopClients } = useTopClients();

  const hasAnyData = (revenue && revenue.length > 0) || (statuses && statuses.length > 0) || (topClients && topClients.length > 0);
  const allLoaded = !loadingRevenue && !loadingStatuses && !loadingTopClients;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analitik</h1>
        <p className="text-sm text-muted-foreground">Insight bisnis kamu dalam grafik</p>
      </div>

      {allLoaded && !hasAnyData ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data analitik"
          description="Tambah invoice & catat pembayaran agar analitik muncul"
        />
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Pendapatan 12 Bulan</CardTitle></CardHeader>
            <CardContent>
              {loadingRevenue ? (
                <ChartSkeleton height={300} />
              ) : revenue && revenue.length > 0 ? (
                <RevenueChart data={revenue} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data pendapatan
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribusi Status Invoice</CardTitle></CardHeader>
              <CardContent>
                {loadingStatuses ? (
                  <ChartSkeleton height={260} />
                ) : statuses && statuses.length > 0 ? (
                  <StatusDistributionChart data={statuses} />
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top 5 Klien</CardTitle></CardHeader>
              <CardContent>
                {loadingTopClients ? (
                  <ChartSkeleton height={260} />
                ) : topClients && topClients.length > 0 ? (
                  <TopClientsChart data={topClients} />
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
