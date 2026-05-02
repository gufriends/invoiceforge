"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientsDataTable } from "@/components/tables/clients-data-table";

export default function ClientsPage() {
  return (
    <div className="space-y-4 max-w-screen-xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Klien</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola data klien kamu.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/clients/create">
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Klien
          </Link>
        </Button>
      </div>

      <ClientsDataTable />
    </div>
  );
}
