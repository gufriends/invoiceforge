"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companySchema } from "@/lib/validations";
import {
  PROVINCES_ID,
  CURRENCIES,
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_LABELS,
} from "@/lib/constants";
import type { CompanyFormValues } from "@/types/forms";

interface Props {
  initialValues: Partial<CompanyFormValues>;
  onSubmit: (data: CompanyFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function CompanyForm({ initialValues, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      logo: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Indonesia",
      phone: "",
      email: "",
      website: "",
      npwp: "",
      bankName: "",
      bankAccount: "",
      bankHolder: "",
      invoicePrefix: "INV",
      invoiceTemplate: "modern",
      primaryColor: "#2563eb",
      currency: "IDR",
      taxRate: 11,
      ...initialValues,
    },
  });

  const province = watch("province");
  const currency = watch("currency");
  const template = watch("invoiceTemplate");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informasi Perusahaan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nama Perusahaan <span className="text-destructive">*</span></Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="https://..." {...register("website")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" {...register("npwp")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alamat</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" rows={3} {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Kota</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Select value={province || ""} onValueChange={(v) => setValue("province", v ?? "")}>

              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {PROVINCES_ID.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos</Label>
            <Input id="postalCode" {...register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Negara</Label>
            <Input id="country" {...register("country")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rekening Bank</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bankName">Nama Bank</Label>
            <Input id="bankName" placeholder="BCA / Mandiri / BNI" {...register("bankName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">No. Rekening</Label>
            <Input id="bankAccount" {...register("bankAccount")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankHolder">Atas Nama</Label>
            <Input id="bankHolder" {...register("bankHolder")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pengaturan Invoice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Prefix Nomor Invoice</Label>
            <Input id="invoicePrefix" {...register("invoicePrefix")} />
            <p className="text-xs text-muted-foreground">Contoh: INV → INV-2026-0001</p>
          </div>
          <div className="space-y-2">
            <Label>Template Default</Label>
            <Select value={template} onValueChange={(v) => setValue("invoiceTemplate", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Uang Default</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">PPN Default (%)</Label>
            <Input id="taxRate" type="number" step="0.1" {...register("taxRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Warna Brand</Label>
            <div className="flex gap-2">
              <Input id="primaryColor" type="color" className="w-16 p-1" {...register("primaryColor")} />
              <Input {...register("primaryColor")} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}