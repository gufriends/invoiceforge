"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartSkeleton } from "@/components/custom/loading-skeleton";
import { EmptyState } from "@/components/custom/empty-state";
import {
  useRevenueData,
  useStatusDistribution,
  useTopClients,
} from "@/hooks/use-analytics";

const RevenueChart = dynamic(() => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={300} />,
});
const StatusDistributionChart = dynamic(() => import("@/components/charts/status-distribution").then((m) => m.StatusDistributionChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});
const TopClientsChart = dynamic(() => import("@/components/charts/top-clients-chart").then((m) => m.TopClientsChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

const RANGE_OPTIONS = [
  { value: "3", label: "3B" },
  { value: "6", label: "6B" },
  { value: "12", label: "12B" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("12");
  const months = parseInt(range);

  const { data: revenue, isLoading: loadingRevenue } = useRevenueData(months);
  const { data: statuses, isLoading: loadingStatuses } = useStatusDistribution();
  const { data: topClients, isLoading: loadingTopClients } = useTopClients();

  const hasAnyData = (revenue && revenue.length > 0) || (statuses && statuses.length > 0) || (topClients && topClients.length > 0);
  const allLoaded = !loadingRevenue && !loadingStatuses && !loadingTopClients;

  return (
    <div className="space-y-4 max-w-screen-xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analitik</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Insight bisnis kamu dalam grafik.</p>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(v) => v && setRange(v)}
          variant="outline"
          size="sm"
        >
          {RANGE_OPTIONS.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} className="text-xs h-7 px-3">
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {allLoaded && !hasAnyData ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data analitik"
          description="Tambah invoice & catat pembayaran agar analitik muncul"
        />
      ) : (
        <>
          {/* Revenue chart — full width */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pendapatan {range} Bulan Terakhir</CardTitle>
              <CardDescription>Tren pendapatan invoice yang dibayar</CardDescription>
            </CardHeader>
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

          {/* 2-col charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribusi Status Invoice</CardTitle>
                <CardDescription>Proporsi status semua invoice</CardDescription>
              </CardHeader>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top 5 Klien</CardTitle>
                <CardDescription>Klien dengan pendapatan terbesar</CardDescription>
              </CardHeader>
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
