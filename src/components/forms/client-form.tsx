"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  const province = watch("province");
  const isActive = watch("isActive");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="Contoh: Budi Santoso" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="email@contoh.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input id="phone" placeholder="+62 812 3456 7890" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company">Nama Perusahaan</Label>
            <Input id="company" placeholder="PT Contoh Sukses" {...register("company")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alamat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" rows={3} placeholder="Jalan, no, RT/RW" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Kota / Kabupaten</Label>
            <Input id="city" placeholder="Jakarta Selatan" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Provinsi</Label>
            <Select value={province || ""} onValueChange={(v) => setValue("province", v ?? "")}>

              <SelectTrigger>
                <SelectValue placeholder="Pilih provinsi" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES_ID.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos</Label>
            <Input id="postalCode" placeholder="12345" {...register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Negara</Label>
            <Input id="country" {...register("country")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" placeholder="XX.XXX.XXX.X-XXX.XXX" {...register("npwp")} />
            {errors.npwp && <p className="text-xs text-destructive">{errors.npwp.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" rows={3} placeholder="Catatan internal" {...register("notes")} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 pt-2">
            <Switch checked={isActive} onCheckedChange={(c) => setValue("isActive", c)} id="isActive" />
            <Label htmlFor="isActive" className="font-normal">Klien aktif</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}