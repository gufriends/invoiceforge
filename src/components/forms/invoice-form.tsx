"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ItemEditor } from "@/components/custom/item-editor";
import { ClientSelect } from "@/components/custom/client-select";
import { CurrencyInput } from "@/components/custom/currency-input";
import { invoiceSchema } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/utils/calculate-totals";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import {
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
const inThirtyDays = new Date(today);
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
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { ...DEFAULTS, ...initialValues },
  });

  const items = form.watch("items");
  const taxRate = form.watch("taxRate");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const isRecurring = form.watch("isRecurring");

  const totals = useMemo(
    () => calculateInvoiceTotals({ items, taxRate, discountType, discountValue }),
    [items, taxRate, discountType, discountValue]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Invoice */}
        <Card>
          <CardHeader><CardTitle>Informasi Invoice</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Invoice <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="INV-2026-0001" className="font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="issueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Terbit <span className="text-destructive">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd MMMM yyyy", { locale: localeID })
                          : "Pilih tanggal"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={(d) => d && field.onChange(d)} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Jatuh Tempo <span className="text-destructive">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd MMMM yyyy", { locale: localeID })
                          : "Pilih tanggal"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={(d) => d && field.onChange(d)} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Klien */}
        <Card>
          <CardHeader><CardTitle>Klien <span className="text-destructive">*</span></CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ClientSelect
                    value={field.value}
                    onChange={(id) => field.onChange(id ?? "")}
                    onCreateNew={() => window.open("/clients/create", "_blank")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Item */}
        <Card>
          <CardHeader><CardTitle>Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="items" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ItemEditor items={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="taxRate" render={({ field }) => (
                <FormItem>
                  <FormLabel>PPN (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="font-mono"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="discountValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Diskon</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={discountType}
                      onValueChange={(v) => form.setValue("discountType", v as "PERCENTAGE" | "FIXED")}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Persen %</SelectItem>
                        <SelectItem value="FIXED">Jumlah Rp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormControl>
                      {discountType === "FIXED" ? (
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className="flex-1 font-mono"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Totals summary */}
            <div className="rounded-md border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon</span>
                <span className="font-mono text-destructive">- {formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PPN ({taxRate}%)</span>
                <span className="font-mono">{formatCurrency(totals.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="font-mono text-primary">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catatan & Syarat */}
        <Card>
          <CardHeader><CardTitle>Catatan & Syarat</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Pesan untuk klien" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="terms" render={({ field }) => (
              <FormItem>
                <FormLabel>Syarat & Ketentuan</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isRecurring" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Invoice berulang (recurring)</FormLabel>
              </FormItem>
            )} />
            {isRecurring && (
              <FormField control={form.control} name="recurringCycle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Siklus Pengulangan</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Pilih siklus" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRING_CYCLES.map((c) => (
                        <SelectItem key={c} value={c}>{RECURRING_CYCLE_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
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
    </Form>
  );
}
