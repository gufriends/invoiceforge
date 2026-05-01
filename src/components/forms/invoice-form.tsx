"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemEditor } from "@/components/custom/item-editor";
import { ClientSelect } from "@/components/custom/client-select";
import { CurrencyInput } from "@/components/custom/currency-input";
import { invoiceSchema } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/utils/calculate-totals";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import {
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_LABELS,
  RECURRING_CYCLES,
  RECURRING_CYCLE_LABELS,
} from "@/lib/constants";
import type { InvoiceFormValues } from "@/types/forms";

interface Props {
  initialValues?: Partial<InvoiceFormValues>;
  onSubmit: (data: InvoiceFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const today = new Date();
const inThirtyDays = new Date();
inThirtyDays.setDate(inThirtyDays.getDate() + 30);

const DEFAULTS: InvoiceFormValues = {
  invoiceNumber: "",
  clientId: "",
  issueDate: today,
  dueDate: inThirtyDays,
  template: "modern",
  items: [{ name: "", description: "", quantity: 1, unitPrice: 0, order: 0 }],
  taxRate: 11,
  discountType: "PERCENTAGE",
  discountValue: 0,
  notes: "",
  terms: "Pembayaran dilakukan dalam 30 hari sejak tanggal invoice diterbitkan.",
  isRecurring: false,
  recurringCycle: null,
};

export function InvoiceForm({ initialValues, onSubmit, loading, submitLabel = "Simpan" }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { ...DEFAULTS, ...initialValues },
  });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const isRecurring = watch("isRecurring");
  const issueDate = watch("issueDate");
  const dueDate = watch("dueDate");
  const template = watch("template");

  const totals = useMemo(
    () => calculateInvoiceTotals({ items, taxRate, discountType, discountValue }),
    [items, taxRate, discountType, discountValue]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Info Invoice */}
      <Card>
        <CardHeader><CardTitle>Informasi Invoice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Nomor Invoice <span className="text-destructive">*</span></Label>
            <Input id="invoiceNumber" placeholder="INV-2026-0001" {...register("invoiceNumber")} className="font-mono" />
            {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={(v) => setValue("template", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Terbit <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !issueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issueDate ? format(issueDate, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={issueDate} onSelect={(d) => d && setValue("issueDate", d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Jatuh Tempo <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setValue("dueDate", d)} />
              </PopoverContent>
            </Popover>
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Klien */}
      <Card>
        <CardHeader><CardTitle>Klien <span className="text-destructive">*</span></CardTitle></CardHeader>
        <CardContent>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientSelect
                value={field.value}
                onChange={(id) => field.onChange(id ?? "")}
                onCreateNew={() => window.open("/clients/create", "_blank")}
              />
            )}
          />
          {errors.clientId && <p className="mt-2 text-xs text-destructive">{errors.clientId.message}</p>}
        </CardContent>
      </Card>

      {/* Section 3: Items */}
      <Card>
        <CardHeader><CardTitle>Item</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="items"
            control={control}
            render={({ field }) => <ItemEditor items={field.value} onChange={field.onChange} />}
          />
          {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxRate">PPN (%)</Label>
              <Input id="taxRate" type="number" min="0" max="100" step="0.1" {...register("taxRate", { valueAsNumber: true })} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Diskon</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(v) => setValue("discountType", v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Persen %</SelectItem>
                    <SelectItem value="FIXED">Jumlah Rp</SelectItem>
                  </SelectContent>
                </Select>
                {discountType === "FIXED" ? (
                  <CurrencyInput value={discountValue} onChange={(v) => setValue("discountValue", v)} className="flex-1" />
                ) : (
                  <Input type="number" min="0" max="100" step="0.1" value={discountValue} onChange={(e) => setValue("discountValue", Number(e.target.value))} className="flex-1 font-mono" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Diskon</span>
              <span className="font-mono">- {formatCurrency(totals.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>PPN ({taxRate}%)</span>
              <span className="font-mono">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>TOTAL</span>
              <span className="font-mono text-primary">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Tambahan */}
      <Card>
        <CardHeader><CardTitle>Catatan & Syarat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" rows={3} placeholder="Pesan untuk klien" {...register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Syarat & Ketentuan</Label>
            <Textarea id="terms" rows={3} {...register("terms")} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isRecurring} onCheckedChange={(c) => setValue("isRecurring", c)} id="isRecurring" />
            <Label htmlFor="isRecurring" className="font-normal">Invoice berulang (recurring)</Label>
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <Label>Siklus Pengulangan</Label>
              <Select
                value={watch("recurringCycle") ?? ""}
                onValueChange={(v) => setValue("recurringCycle", v as any)}
              >
                <SelectTrigger><SelectValue placeholder="Pilih siklus" /></SelectTrigger>
                <SelectContent>
                  {RECURRING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{RECURRING_CYCLE_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}