"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/custom/currency-input";
import { paymentSchema } from "@/lib/validations";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format-currency";
import type { PaymentFormValues } from "@/types/forms";

interface Props {
  remainingAmount: number;
  initialValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void | Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export function PaymentForm({ remainingAmount, initialValues, onSubmit, loading, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      method: "BANK_TRANSFER",
      date: new Date(),
      reference: "",
      notes: "",
      ...initialValues,
    },
  });

  const amount = watch("amount");
  const date = watch("date");
  const method = watch("method");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md bg-muted/30 p-3 text-sm">
        <div className="flex justify-between">
          <span>Sisa tagihan:</span>
          <span className="font-mono font-semibold">{formatCurrency(remainingAmount)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Jumlah Pembayaran <span className="text-destructive">*</span></Label>
        <CurrencyInput value={amount} onChange={(v) => setValue("amount", v, { shouldValidate: true })} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        <div className="flex gap-2 text-xs">
          <Button type="button" size="sm" variant="outline" onClick={() => setValue("amount", remainingAmount)}>
            Lunasi semua
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setValue("amount", Math.floor(remainingAmount / 2))}>
            Setengah
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Metode Pembayaran <span className="text-destructive">*</span></Label>
        <Select value={method} onValueChange={(v) => setValue("method", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tanggal Pembayaran <span className="text-destructive">*</span></Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Calendar mode="single" selected={field.value} onSelect={(d) => d && field.onChange(d)} />
              )}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Nomor Referensi</Label>
        <Input id="reference" placeholder="No. transfer / referensi" {...register("reference")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pembayaran
        </Button>
      </div>
    </form>
  );
}