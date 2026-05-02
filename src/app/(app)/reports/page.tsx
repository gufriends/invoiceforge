"use client";

import { Download, Wallet, Receipt, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="space-y-4 max-w-screen-xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Laporan keuangan & tagihan.</p>
      </div>

      <Tabs defaultValue="income">
        <TabsList className="h-8">
          <TabsTrigger value="income" className="text-xs gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Pendapatan
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> PPN
          </TabsTrigger>
          <TabsTrigger value="aging" className="text-xs gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Aging
          </TabsTrigger>
        </TabsList>

        {/* ── Pendapatan ── */}
        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Laporan Pendapatan</CardTitle>
                <CardDescription>Semua pembayaran yang diterima</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
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
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pendapatan</p>
                <p className="text-2xl font-bold font-mono mt-0.5">{formatCurrency(income?.total ?? 0)}</p>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs font-medium">Tanggal</TableHead>
                      <TableHead className="text-xs font-medium">Invoice</TableHead>
                      <TableHead className="text-xs font-medium hidden sm:table-cell">Klien</TableHead>
                      <TableHead className="text-xs font-medium hidden md:table-cell">Metode</TableHead>
                      <TableHead className="text-xs font-medium text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income?.payments.map((p: any) => (
                      <TableRow key={p.id} className="h-9">
                        <TableCell className="text-xs text-muted-foreground">{formatDate(p.date)}</TableCell>
                        <TableCell className="font-mono text-xs">{p.invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{p.invoice.client.name}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS]}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PPN ── */}
        <TabsContent value="tax" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Laporan PPN</CardTitle>
              <CardDescription>Rekapitulasi pajak pertambahan nilai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total DPP</p>
                  <p className="text-2xl font-bold font-mono mt-0.5">{formatCurrency(tax?.totalDPP ?? 0)}</p>
                </div>
                <div className="rounded-md bg-primary/10 px-4 py-3">
                  <p className="text-xs text-primary uppercase tracking-wide">Total PPN</p>
                  <p className="text-2xl font-bold font-mono text-primary mt-0.5">{formatCurrency(tax?.totalTax ?? 0)}</p>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs font-medium">Tanggal</TableHead>
                      <TableHead className="text-xs font-medium">Invoice</TableHead>
                      <TableHead className="text-xs font-medium hidden sm:table-cell">Klien</TableHead>
                      <TableHead className="text-xs font-medium text-right hidden md:table-cell">DPP</TableHead>
                      <TableHead className="text-xs font-medium text-right">PPN</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tax?.invoices.map((inv: any, i: number) => (
                      <TableRow key={i} className="h-9">
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                        <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{inv.client.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs hidden md:table-cell">{formatCurrency(inv.subtotal)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.taxAmount)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(inv.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aging ── */}
        <TabsContent value="aging" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aging Piutang</CardTitle>
              <CardDescription>Distribusi tagihan berdasarkan umur keterlambatan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-md border px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Belum Jatuh Tempo</p>
                  <p className="text-xl font-bold font-mono mt-1">{formatCurrency(aging?.current ?? 0)}</p>
                </div>
                <div className="rounded-md border bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide">1 – 30 hari</p>
                  <p className="text-xl font-bold font-mono mt-1">{formatCurrency(aging?.thirtyDays ?? 0)}</p>
                </div>
                <div className="rounded-md border bg-orange-50 dark:bg-orange-900/20 px-4 py-3">
                  <p className="text-xs text-orange-700 dark:text-orange-400 uppercase tracking-wide">31 – 60 hari</p>
                  <p className="text-xl font-bold font-mono mt-1">{formatCurrency(aging?.sixtyDays ?? 0)}</p>
                </div>
                <div className="rounded-md border bg-red-50 dark:bg-red-900/20 px-4 py-3">
                  <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">60+ hari</p>
                  <p className="text-xl font-bold font-mono mt-1">{formatCurrency(aging?.ninetyPlusDays ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
