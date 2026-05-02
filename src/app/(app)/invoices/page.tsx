"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoicesDataTable } from "@/components/tables/invoices-data-table";

export default function InvoicesPage() {
  return (
    <div className="space-y-4 max-w-screen-xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Buat & kelola semua invoice kamu.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/invoices/create">
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Invoice
          </Link>
        </Button>
      </div>

      <InvoicesDataTable />
    </div>
  );
}
