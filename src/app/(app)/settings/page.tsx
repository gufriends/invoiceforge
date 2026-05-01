"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CompanyForm } from "@/components/forms/company-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCompany, useUpdateCompany } from "@/hooks/use-company";
import { CURRENCIES, INVOICE_TEMPLATES, INVOICE_TEMPLATE_LABELS } from "@/lib/constants";
import type { CompanyFormValues } from "@/types/forms";

// ─── Profile Tab ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileTab() {
  const { data: session, update: updateSession } = useSession();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Gagal memperbarui profil");
      await updateSession({ name: data.name });
      toast.success("Profil diperbarui");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>Informasi akun kamu yang tampil di aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nama</Label>
            <Input id="profile-name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={session?.user?.email ?? ""}
              readOnly
              disabled
            />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              Email tidak bisa diubah
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Profil
        </Button>
      </div>
    </form>
  );
}

// ─── Invoice Settings Tab ─────────────────────────────────────────────────────

type InvoiceSettingsValues = Pick<
  CompanyFormValues,
  "invoicePrefix" | "invoiceTemplate" | "currency" | "taxRate" | "primaryColor"
>;

function InvoiceTab() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceSettingsValues>({
    defaultValues: {
      invoicePrefix: company?.invoicePrefix ?? "INV",
      invoiceTemplate: (company?.invoiceTemplate as any) ?? "modern",
      currency: (company?.currency as any) ?? "IDR",
      taxRate: company?.taxRate ?? 11,
      primaryColor: company?.primaryColor ?? "#2563eb",
    },
  });

  const template = watch("invoiceTemplate");
  const currency = watch("currency");

  if (isLoading) return <FormSkeleton />;

  const onSubmit = async (data: InvoiceSettingsValues) => {
    if (!company) return;
    await update.mutateAsync({ ...company, ...data } as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Invoice</CardTitle>
          <CardDescription>Konfigurasi default untuk invoice yang dibuat</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inv-prefix">Prefix Nomor Invoice</Label>
            <Input id="inv-prefix" {...register("invoicePrefix")} />
            <p className="text-xs text-muted-foreground">Contoh: INV → INV-2026-0001</p>
            {errors.invoicePrefix && (
              <p className="text-xs text-destructive">{errors.invoicePrefix.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Template Default</Label>
            <Select value={template} onValueChange={(v) => setValue("invoiceTemplate", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Uang Default</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-taxrate">PPN Default (%)</Label>
            <Input
              id="inv-taxrate"
              type="number"
              step="0.1"
              {...register("taxRate", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="inv-color">Warna Brand</Label>
            <div className="flex gap-2">
              <Input
                id="inv-color"
                type="color"
                className="w-16 p-1"
                {...register("primaryColor")}
              />
              <Input {...register("primaryColor")} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengaturan Invoice
        </Button>
      </div>
    </form>
  );
}

// ─── Notifikasi Tab ───────────────────────────────────────────────────────────

const NOTIF_ITEMS = [
  {
    id: "notif_invoice_sent",
    label: "Invoice Terkirim",
    description: "Notifikasi saat invoice berhasil dikirim ke klien",
  },
  {
    id: "notif_invoice_paid",
    label: "Invoice Lunas",
    description: "Notifikasi saat pembayaran diterima",
  },
  {
    id: "notif_invoice_overdue",
    label: "Invoice Jatuh Tempo",
    description: "Pengingat saat invoice mendekati atau melewati jatuh tempo",
  },
  {
    id: "notif_new_client",
    label: "Klien Baru",
    description: "Notifikasi saat klien baru ditambahkan",
  },
  {
    id: "notif_weekly_report",
    label: "Laporan Mingguan",
    description: "Ringkasan aktivitas setiap minggu via email",
  },
] as const;

function NotifikasiTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    notif_invoice_sent: true,
    notif_invoice_paid: true,
    notif_invoice_overdue: true,
    notif_new_client: false,
    notif_weekly_report: false,
  });

  const handleToggle = (id: string, checked: boolean) => {
    setEnabled((prev) => ({ ...prev, [id]: checked }));
    toast.success(checked ? "Notifikasi diaktifkan" : "Notifikasi dinonaktifkan");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Preferensi Notifikasi</CardTitle>
          <CardDescription>Pilih jenis notifikasi yang ingin kamu terima</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {NOTIF_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={enabled[item.id] ?? false}
                onCheckedChange={(checked) => handleToggle(item.id, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Keamanan Tab ─────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus ada huruf kapital")
      .regex(/[a-z]/, "Password harus ada huruf kecil")
      .regex(/[0-9]/, "Password harus ada angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function KeamananTab() {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Gagal mengubah password");
      toast.success("Password berhasil diubah");
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>Pastikan kamu menggunakan password yang kuat dan unik</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ubah Password
        </Button>
      </div>
    </form>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();

  const handleCompanySubmit = async (data: CompanyFormValues) => {
    await update.mutateAsync(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil perusahaan &amp; preferensi aplikasi
        </p>
      </div>

      <Tabs defaultValue="perusahaan">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="perusahaan">Perusahaan</TabsTrigger>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        </TabsList>

        <TabsContent value="perusahaan" className="mt-6">
          {isLoading || !company ? (
            <FormSkeleton />
          ) : (
            <CompanyForm
              initialValues={{
                name: company.name,
                logo: company.logo ?? "",
                address: company.address ?? "",
                city: company.city ?? "",
                province: company.province ?? "",
                postalCode: company.postalCode ?? "",
                country: company.country,
                phone: company.phone ?? "",
                email: company.email ?? "",
                website: company.website ?? "",
                npwp: company.npwp ?? "",
                bankName: company.bankName ?? "",
                bankAccount: company.bankAccount ?? "",
                bankHolder: company.bankHolder ?? "",
                invoicePrefix: company.invoicePrefix,
                invoiceTemplate: company.invoiceTemplate as any,
                primaryColor: company.primaryColor,
                currency: company.currency as any,
                taxRate: company.taxRate,
              }}
              onSubmit={handleCompanySubmit}
              loading={update.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="profil" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="invoice" className="mt-6">
          <InvoiceTab />
        </TabsContent>

        <TabsContent value="notifikasi" className="mt-6">
          <NotifikasiTab />
        </TabsContent>

        <TabsContent value="keamanan" className="mt-6">
          <KeamananTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
