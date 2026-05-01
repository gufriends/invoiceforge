"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useInvoices, useDeleteInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { SearchInput } from "@/components/custom/search-input";
import { EmptyState } from "@/components/custom/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InvoiceStatus } from "@/lib/constants";

const TABS: { value: InvoiceStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Terkirim" },
  { value: "PAID", label: "Lunas" },
  { value: "OVERDUE", label: "Jatuh Tempo" },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useInvoices({
    page,
    limit: 10,
    search: search || undefined,
    status,
  });
  const del = useDeleteInvoice();
  const dup = useDuplicateInvoice();
  const send = useSendInvoice();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await del.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice</h1>
          <p className="text-sm text-muted-foreground">Buat & kelola semua invoice kamu</p>
        </div>
        <Button asChild>
          <Link href="/invoices/create"><Plus className="mr-2 h-4 w-4" /> Buat Invoice</Link>
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
          <TabsList>
            {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nomor invoice atau klien..." />
      </Card>

      {!isLoading && (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? "Invoice tidak ditemukan" : "Belum ada invoice"}
          description={search ? "Coba kata kunci atau filter lain" : "Buat invoice pertama kamu sekarang"}
          action={!search ? { label: "Buat Invoice", onClick: () => location.assign("/invoices/create") } : undefined}
        />
      ) : (
        <InvoicesTable
          data={data?.data ?? []}
          loading={isLoading}
          onDelete={setDeleteId}
          onDuplicate={(id) => dup.mutate(id)}
          onSend={(id) => send.mutate(id)}
        />
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Halaman {data.meta.page} dari {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus invoice ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak bisa dibatalkan. Invoice yang sudah lunas tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}