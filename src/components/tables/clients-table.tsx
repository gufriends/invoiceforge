"use client";

import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/format-currency";
import { TableSkeleton } from "@/components/custom/loading-skeleton";
import type { ClientWithStats } from "@/types/client";

interface Props {
  data: ClientWithStats[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export function ClientsTable({ data, loading, onDelete }: Props) {
  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Perusahaan</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total Invoice</TableHead>
            <TableHead className="text-right">Total Pendapatan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id} className="hover:bg-muted/50">
              <TableCell>
                <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.company || "-"}</TableCell>
              <TableCell className="text-sm">{c.email}</TableCell>
              <TableCell className="text-right font-mono text-sm">{c.totalInvoices}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(c.totalRevenue)}</TableCell>
              <TableCell>
                <Badge variant={c.isActive ? "default" : "secondary"}>
                  {c.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Aksi klien ${c.name}`}>
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
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(c.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}