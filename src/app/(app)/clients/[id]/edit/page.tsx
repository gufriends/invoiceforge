"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import type { ClientFormOutput } from "@/types/forms";

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading } = useClient(id);
  const update = useUpdateClient();

  const handleSubmit = async (data: ClientFormOutput) => {
    await update.mutateAsync({ id, data });
    router.push(`/clients/${id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Klien</h1>
          <p className="text-sm text-muted-foreground">Perbarui data klien</p>
        </div>
      </div>
      {isLoading || !client ? (
        <FormSkeleton />
      ) : (
        <ClientForm
          initialValues={{
            name: client.name,
            email: client.email,
            phone: client.phone ?? "",
            company: client.company ?? "",
            address: client.address ?? "",
            city: client.city ?? "",
            province: client.province ?? "",
            postalCode: client.postalCode ?? "",
            country: client.country,
            npwp: client.npwp ?? "",
            notes: client.notes ?? "",
            isActive: client.isActive,
          }}
          onSubmit={handleSubmit}
          loading={update.isPending}
          submitLabel="Update Klien"
        />
      )}
    </div>
  );
}