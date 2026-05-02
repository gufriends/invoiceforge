"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import type { ClientFormValues } from "@/types/forms";

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading } = useClient(id);
  const update = useUpdateClient();

  const handleSubmit = async (data: ClientFormValues) => {
    await update.mutateAsync({ id, data });
    router.push(`/clients/${id}`);
  };

  return (
    <div className="space-y-4 max-w-screen-md">
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/clients/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit Klien</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Perbarui data klien.</p>
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