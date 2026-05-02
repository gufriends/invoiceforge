"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, FileText, Eye, X } from "lucide-react";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/custom/search-input";
import { formatCurrency } from "@/utils/format-currency";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import type { ClientWithStats } from "@/types/client";

export function ClientsDataTable() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const query = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    isActive: activeFilter,
    sortBy: (sorting[0]?.id ?? "createdAt") as any,
    sortOrder: (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc",
  }), [pagination, sorting, search, activeFilter]);

  const { data, isFetching } = useClients(query);
  const deleteClient = useDeleteClient();

  const handleSortChange = useCallback((updater: any) => {
    setSorting(updater);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const columns = useMemo<ColumnDef<ClientWithStats>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
      cell: ({ row }) => (
        <div>
          <Link href={`/clients/${row.original.id}`} className="text-sm font-medium hover:underline">
            {row.original.name}
          </Link>
          {row.original.company && (
            <div className="text-xs text-muted-foreground mt-0.5">{row.original.company}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "phone",
      header: "Telepon",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone || "—"}</span>,
    },
    {
      id: "totalInvoices",
      accessorKey: "totalInvoices",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" className="justify-end w-full text-right" />,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">{row.original.totalInvoices}</div>
      ),
    },
    {
      id: "totalRevenue",
      accessorKey: "totalRevenue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pendapatan" className="justify-end w-full text-right" />,
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm font-medium">{formatCurrency(row.original.totalRevenue)}</div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-xs">
          {row.original.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/clients/${c.id}`}><Eye className="mr-2 h-4 w-4" /> Lihat detail</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clients/${c.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/invoices/create?clientId=${c.id}`}>
                  <FileText className="mr-2 h-4 w-4" /> Buat invoice
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteClient.mutate(c.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteClient]);

  const rowCount = data?.meta.total ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari klien..."
          className="max-w-xs"
        />
        <div className="flex gap-1.5">
          {[
            { label: "Semua", value: undefined },
            { label: "Aktif", value: true },
            { label: "Nonaktif", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { setActiveFilter(opt.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
                activeFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowCount={rowCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={handleSortChange}
        isLoading={isFetching && rows.length === 0}
        emptyMessage="Tidak ada klien. Tambah klien pertama Anda."
      />

      <DataTablePagination
        table={{
          getState: () => ({ pagination }),
          getPageCount: () => Math.ceil(rowCount / pagination.pageSize),
          getRowCount: () => rowCount,
          getCanPreviousPage: () => pagination.pageIndex > 0,
          getCanNextPage: () => pagination.pageIndex < Math.ceil(rowCount / pagination.pageSize) - 1,
          firstPage: () => setPagination((p) => ({ ...p, pageIndex: 0 })),
          previousPage: () => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 })),
          nextPage: () => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 })),
          lastPage: () => setPagination((p) => ({ ...p, pageIndex: Math.ceil(rowCount / p.pageSize) - 1 })),
          setPageSize: (size: number) => setPagination({ pageIndex: 0, pageSize: size }),
        } as any}
      />
    </div>
  );
}
