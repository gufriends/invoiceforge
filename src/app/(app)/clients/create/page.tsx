"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { useCreateClient } from "@/hooks/use-clients";
import type { ClientFormValues } from "@/types/forms";

export default function CreateClientPage() {
  const router = useRouter();
  const create = useCreateClient();

  const handleSubmit = async (data: ClientFormValues) => {
    const client = await create.mutateAsync(data);
    router.push(`/clients/${client.id}`);
  };

  return (
    <div className="space-y-4 max-w-screen-md">
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tambah Klien</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Masukkan data klien baru.</p>
        </div>
      </div>
      <ClientForm onSubmit={handleSubmit} loading={create.isPending} submitLabel="Simpan Klien" />
    </div>
  );
}