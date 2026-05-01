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