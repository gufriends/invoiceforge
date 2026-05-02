"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { companySchema } from "@/lib/validations";
import { PROVINCES_ID, CURRENCIES } from "@/lib/constants";
import { TemplateSelector } from "@/components/ui/template-selector";
import type { CompanyFormValues } from "@/types/forms";
import type { InvoiceTemplate } from "@/lib/constants";

interface Props {
  initialValues: Partial<CompanyFormValues>;
  onSubmit: (data: CompanyFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function CompanyForm({ initialValues, onSubmit, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<CompanyFormValues>({
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) form.setValue("logo", json.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Perusahaan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perusahaan</CardTitle>
            <CardDescription>Detail identitas bisnis Anda</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Logo upload */}
            <FormField control={form.control} name="logo" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Logo Perusahaan</FormLabel>
                <div className="flex items-center gap-3">
                  {field.value && (
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={field.value} alt="Logo" className="h-12 w-auto max-w-[120px] rounded border object-contain" />
                      <button type="button" onClick={() => form.setValue("logo", "")} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {uploading ? "Mengunggah..." : "Unggah Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">SVG direkomendasikan</span> — skala sempurna di semua ukuran.<br />
                      PNG transparan juga bagus, minimal <span className="font-medium text-foreground">400 × 200 px</span> agar tidak buram di PDF.<br />
                      Rasio ideal <span className="font-medium text-foreground">2:1 – 4:1</span> (landscape). Hindari logo kotak atau portrait.<br />
                      Maks. <span className="font-medium text-foreground">1 MB</span>.
                    </p>
                  </div>
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nama Perusahaan <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telepon</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Website</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="npwp" render={({ field }) => (
              <FormItem>
                <FormLabel>NPWP</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card>
          <CardHeader>
            <CardTitle>Alamat</CardTitle>
            <CardDescription>Alamat lengkap perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Kota</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="province" render={({ field }) => (
              <FormItem>
                <FormLabel>Provinsi</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih provinsi" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVINCES_ID.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="postalCode" render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Pos</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Negara</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Rekening Bank */}
        <Card>
          <CardHeader>
            <CardTitle>Rekening Bank</CardTitle>
            <CardDescription>Ditampilkan pada invoice untuk pembayaran</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="bankName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Bank</FormLabel>
                <FormControl><Input placeholder="BCA / Mandiri / BNI" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bankAccount" render={({ field }) => (
              <FormItem>
                <FormLabel>No. Rekening</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bankHolder" render={({ field }) => (
              <FormItem>
                <FormLabel>Atas Nama</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Pengaturan Invoice */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Invoice</CardTitle>
            <CardDescription>Konfigurasi default pembuatan invoice</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="invoicePrefix" render={({ field }) => (
              <FormItem>
                <FormLabel>Prefix Nomor Invoice</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormDescription>Contoh: INV → INV-2026-0001</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="invoiceTemplate" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Template Default</FormLabel>
                <FormControl>
                  <TemplateSelector value={field.value as InvoiceTemplate} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel>Mata Uang Default</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="taxRate" render={({ field }) => (
              <FormItem>
                <FormLabel>PPN Default (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="primaryColor" render={({ field }) => (
              <FormItem>
                <FormLabel>Warna Brand</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="color" className="w-16 p-1" {...field} />
                  </FormControl>
                  <Input
                    value={field.value}
                    onChange={field.onChange}
                    className="font-mono"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </Form>
  );
}
