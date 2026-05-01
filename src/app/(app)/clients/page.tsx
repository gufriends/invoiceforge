"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { ClientsTable } from "@/components/tables/clients-table";
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

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useClients({ page, limit: 10, search: search || undefined });
  const deleteMutation = useDeleteClient();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Klien</h1>
          <p className="text-sm text-muted-foreground">Kelola data klien kamu</p>
        </div>
        <Button asChild>
          <Link href="/clients/create"><Plus className="mr-2 h-4 w-4" /> Tambah Klien</Link>
        </Button>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, email, perusahaan..." />
      </Card>

      {!isLoading && (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Klien tidak ditemukan" : "Belum ada klien"}
          description={search ? "Coba kata kunci lain" : "Mulai dengan menambah klien pertama kamu"}
          action={!search ? { label: "Tambah Klien", onClick: () => location.assign("/clients/create") } : undefined}
        />
      ) : (
        <ClientsTable data={data?.data ?? []} loading={isLoading} onDelete={setDeleteId} />
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {data.meta.page} dari {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus klien ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak bisa dibatalkan. Klien yang punya invoice tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}