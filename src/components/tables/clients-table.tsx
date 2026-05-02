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
  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead className="text-xs font-medium">Nama</TableHead>
            <TableHead className="text-xs font-medium hidden sm:table-cell">Perusahaan</TableHead>
            <TableHead className="text-xs font-medium hidden md:table-cell">Email</TableHead>
            <TableHead className="text-xs font-medium text-right hidden lg:table-cell">Invoice</TableHead>
            <TableHead className="text-xs font-medium text-right">Pendapatan</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id} className="h-10 hover:bg-muted/40">
              <TableCell>
                <div>
                  <Link href={`/clients/${c.id}`} className="text-sm font-medium hover:underline">
                    {c.name}
                  </Link>
                  <div className="text-xs text-muted-foreground sm:hidden">{c.company || c.email}</div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{c.company || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{c.email}</TableCell>
              <TableCell className="text-right font-mono text-sm hidden lg:table-cell">{c.totalInvoices}</TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(c.totalRevenue)}</TableCell>
              <TableCell>
                <Badge variant={c.isActive ? "default" : "secondary"} className="text-xs">
                  {c.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell>
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