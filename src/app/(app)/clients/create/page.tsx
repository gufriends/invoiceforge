"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { useCreateClient } from "@/hooks/use-clients";
import type { ClientFormOutput } from "@/types/forms";

export default function CreateClientPage() {
  const router = useRouter();
  const create = useCreateClient();

  const handleSubmit = async (data: ClientFormOutput) => {
    const client = await create.mutateAsync(data);
    router.push(`/clients/${client.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Klien</h1>
          <p className="text-sm text-muted-foreground">Masukkan data klien baru</p>
        </div>
      </div>
      <ClientForm onSubmit={handleSubmit} loading={create.isPending} submitLabel="Simpan Klien" />
    </div>
  );
}