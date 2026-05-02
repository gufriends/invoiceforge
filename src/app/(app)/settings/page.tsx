"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info, Building2, User, FileText, Bell, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CompanyForm } from "@/components/forms/company-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCompany, useUpdateCompany } from "@/hooks/use-company";
import { CURRENCIES, INVOICE_TEMPLATES, INVOICE_TEMPLATE_LABELS } from "@/lib/constants";
import type { CompanyFormValues } from "@/types/forms";

// ── nav items ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "perusahaan", label: "Perusahaan", icon: Building2 },
  { id: "profil", label: "Profil", icon: User },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "notifikasi", label: "Notifikasi", icon: Bell },
  { id: "keamanan", label: "Keamanan", icon: ShieldCheck },
] as const;

type SettingsTab = (typeof NAV_ITEMS)[number]["id"];

// ── Profile Tab ────────────────────────────────────────────────────────────────

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
    defaultValues: { name: session?.user?.name ?? "" },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Pengguna</CardTitle>
          <CardDescription>Informasi akun kamu yang tampil di aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nama</Label>
            <Input id="profile-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={session?.user?.email ?? ""} readOnly disabled />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" /> Email tidak bisa diubah
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Simpan Profil
        </Button>
      </div>
    </form>
  );
}

// ── Invoice Settings Tab ───────────────────────────────────────────────────────

type InvoiceSettingsValues = Pick<CompanyFormValues, "invoicePrefix" | "invoiceTemplate" | "currency" | "taxRate" | "primaryColor">;

function InvoiceTab() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InvoiceSettingsValues>({
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
  const primaryColor = watch("primaryColor");

  if (isLoading) return <FormSkeleton />;

  const onSubmit = async (data: InvoiceSettingsValues) => {
    if (!company) return;
    await update.mutateAsync({ ...company, ...data } as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan Invoice</CardTitle>
          <CardDescription>Konfigurasi default untuk invoice yang dibuat</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inv-prefix">Prefix Nomor Invoice</Label>
            <Input id="inv-prefix" {...register("invoicePrefix")} />
            <p className="text-xs text-muted-foreground">Contoh: INV → INV-2026-0001</p>
          </div>
          <div className="space-y-1.5">
            <Label>Template Default</Label>
            <Select value={template} onValueChange={(v) => setValue("invoiceTemplate", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mata Uang Default</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-taxrate">PPN Default (%)</Label>
            <Input id="inv-taxrate" type="number" step="0.1" {...register("taxRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Warna Brand</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                className="w-14 h-9 p-1 cursor-pointer"
                value={primaryColor}
                onChange={(e) => setValue("primaryColor", e.target.value)}
              />
              <Input
                className="font-mono uppercase"
                value={primaryColor}
                onChange={(e) => setValue("primaryColor", e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {["#10b981","#14b8a6","#3b82f6","#6366f1","#8b5cf6","#f43f5e","#f59e0b","#64748b"].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setValue("primaryColor", hex)}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: hex, borderColor: primaryColor === hex ? hex : "transparent", outline: primaryColor === hex ? `2px solid ${hex}` : "none", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}

// ── Notifikasi Tab ─────────────────────────────────────────────────────────────

const NOTIF_ITEMS = [
  { id: "notif_invoice_sent", label: "Invoice Terkirim", description: "Notifikasi saat invoice berhasil dikirim ke klien" },
  { id: "notif_invoice_paid", label: "Invoice Lunas", description: "Notifikasi saat pembayaran diterima" },
  { id: "notif_invoice_overdue", label: "Invoice Jatuh Tempo", description: "Pengingat saat invoice mendekati atau melewati jatuh tempo" },
  { id: "notif_new_client", label: "Klien Baru", description: "Notifikasi saat klien baru ditambahkan" },
  { id: "notif_weekly_report", label: "Laporan Mingguan", description: "Ringkasan aktivitas setiap minggu via email" },
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferensi Notifikasi</CardTitle>
        <CardDescription>Pilih jenis notifikasi yang ingin kamu terima</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {NOTIF_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <Switch checked={enabled[item.id] ?? false} onCheckedChange={(v) => handleToggle(item.id, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Keamanan Tab ───────────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[a-z]/, "Harus ada huruf kecil")
    .regex(/[0-9]/, "Harus ada angka"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function KeamananTab() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubah Password</CardTitle>
          <CardDescription>Pastikan kamu menggunakan password yang kuat dan unik</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "current-password", label: "Password Saat Ini", field: "currentPassword" as const, auto: "current-password" },
            { id: "new-password", label: "Password Baru", field: "newPassword" as const, auto: "new-password" },
            { id: "confirm-password", label: "Konfirmasi Password Baru", field: "confirmPassword" as const, auto: "new-password" },
          ].map(({ id, label, field, auto }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id}>{label}</Label>
              <Input id={id} type="password" autoComplete={auto} {...register(field)} />
              {errors[field] && <p className="text-xs text-destructive">{errors[field]?.message}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Ubah Password
        </Button>
      </div>
    </form>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("perusahaan");
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();

  const handleCompanySubmit = async (data: CompanyFormValues) => {
    await update.mutateAsync(data);
  };

  return (
    <div className="space-y-4 max-w-screen-lg">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola profil perusahaan & preferensi aplikasi.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Side nav */}
        <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible lg:w-44 shrink-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
                  activeTab === item.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <Separator orientation="vertical" className="hidden lg:block self-stretch" />

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "perusahaan" && (
            isLoading || !company ? <FormSkeleton /> : (
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
            )
          )}
          {activeTab === "profil" && <ProfileTab />}
          {activeTab === "invoice" && <InvoiceTab />}
          {activeTab === "notifikasi" && <NotifikasiTab />}
          {activeTab === "keamanan" && <KeamananTab />}
        </div>
      </div>
    </div>
  );
}
