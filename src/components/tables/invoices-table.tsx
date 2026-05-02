"use client";

import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { TableSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import type { InvoiceListItem } from "@/types/invoice";

interface Props {
  data: InvoiceListItem[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onSend?: (id: string) => void;
}

export function InvoicesTable({ data, loading, onDelete, onDuplicate, onSend }: Props) {
  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead className="text-xs font-medium">No. Invoice</TableHead>
            <TableHead className="text-xs font-medium">Klien</TableHead>
            <TableHead className="text-xs font-medium hidden sm:table-cell">Tgl Terbit</TableHead>
            <TableHead className="text-xs font-medium hidden md:table-cell">Jatuh Tempo</TableHead>
            <TableHead className="text-xs font-medium text-right">Total</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((inv) => (
            <TableRow key={inv.id} className="h-10 hover:bg-muted/40">
              <TableCell>
                <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-medium hover:underline text-foreground">
                  {inv.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm font-medium leading-none">{inv.client.name}</div>
                  {inv.client.company && <div className="text-xs text-muted-foreground mt-0.5">{inv.client.company}</div>}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{formatDate(inv.issueDate)}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDate(inv.dueDate)}</TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(inv.total)}</TableCell>
              <TableCell><InvoiceStatusBadge status={inv.status} size="sm" /></TableCell>
              <TableCell>
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
                    {onSend && inv.status === "DRAFT" && (
                      <DropdownMenuItem onClick={() => onSend(inv.id)}>
                        <Send className="mr-2 h-4 w-4" /> Tandai Terkirim
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(inv.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplikasi
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(inv.id)} className="text-destructive">
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