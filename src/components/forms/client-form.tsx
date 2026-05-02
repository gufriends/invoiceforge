"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { clientSchema } from "@/lib/validations";
import { PROVINCES_ID } from "@/lib/constants";
import type { ClientFormValues } from "@/types/forms";

interface Props {
  initialValues?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const DEFAULT_VALUES: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Indonesia",
  npwp: "",
  notes: "",
  isActive: true,
};

export function ClientForm({ initialValues, onSubmit, loading, submitLabel = "Simpan" }: Props) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Dasar */}
        <Card>
          <CardHeader><CardTitle>Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nama Lengkap <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Contoh: Budi Santoso" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>No. Telepon</FormLabel>
                <FormControl><Input placeholder="+62 812 3456 7890" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nama Perusahaan</FormLabel>
                <FormControl><Input placeholder="PT Contoh Sukses" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card>
          <CardHeader><CardTitle>Alamat</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Alamat</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Jalan, no, RT/RW" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Kota / Kabupaten</FormLabel>
                <FormControl><Input placeholder="Jakarta Selatan" {...field} /></FormControl>
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
                <FormControl><Input placeholder="12345" {...field} /></FormControl>
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

        {/* Tambahan */}
        <Card>
          <CardHeader><CardTitle>Tambahan</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="npwp" render={({ field }) => (
              <FormItem>
                <FormLabel>NPWP</FormLabel>
                <FormControl><Input placeholder="XX.XXX.XXX.X-XXX.XXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Catatan</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Catatan internal" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 sm:col-span-2 space-y-0 pt-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Klien aktif</FormLabel>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
