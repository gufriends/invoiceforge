"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Send, X } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { SearchInput } from "@/components/custom/search-input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import { useInvoices, useDeleteInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { InvoiceListItem } from "@/types/invoice";
import type { InvoiceStatus } from "@/lib/constants";

const STATUS_OPTIONS = INVOICE_STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS_LABELS[s] }));

export function InvoicesDataTable() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([]);

  const query = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    sortBy: (sorting[0]?.id ?? "createdAt") as any,
    sortOrder: (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc",
  }), [pagination, sorting, search, statusFilter]);

  const { data, isFetching } = useInvoices(query);
  const deleteInvoice = useDeleteInvoice();
  const duplicateInvoice = useDuplicateInvoice();
  const sendInvoice = useSendInvoice();

  const handleSortChange = useCallback((updater: any) => {
    setSorting(updater);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const toggleStatus = useCallback((status: InvoiceStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(() => [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="No. Invoice" />,
      cell: ({ row }) => (
        <Link href={`/invoices/${row.original.id}`} className="font-mono text-xs font-medium hover:underline text-foreground">
          {row.original.invoiceNumber}
        </Link>
      ),
    },
    {
      id: "clientName",
      accessorFn: (row) => row.client.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Klien" />,
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium leading-none">{row.original.client.name}</div>
          {row.original.client.company && (
            <div className="text-xs text-muted-foreground mt-0.5">{row.original.client.company}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl Terbit" />,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.issueDate)}</span>,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jatuh Tempo" />,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.dueDate)}</span>,
    },
    {
      accessorKey: "total",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end w-full text-right" />,
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm font-medium">{formatCurrency(row.original.total)}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${inv.id}`}><Eye className="mr-2 h-4 w-4" /> Detail</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${inv.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
              </DropdownMenuItem>
              {inv.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => sendInvoice.mutate(inv.id)}>
                  <Send className="mr-2 h-4 w-4" /> Tandai Terkirim
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => duplicateInvoice.mutate(inv.id)}>
                <Copy className="mr-2 h-4 w-4" /> Duplikasi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteInvoice.mutate(inv.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteInvoice, duplicateInvoice, sendInvoice]);

  const rowCount = data?.meta.total ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari invoice..."
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleStatus(s.value as InvoiceStatus)}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
                statusFilter.includes(s.value as InvoiceStatus)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <button
              onClick={() => { setStatusFilter([]); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Reset
            </button>
          )}
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
        emptyMessage="Tidak ada invoice. Buat invoice pertama Anda."
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
