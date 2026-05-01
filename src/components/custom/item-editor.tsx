"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/custom/currency-input";
import { formatCurrency } from "@/utils/format-currency";
import type { ItemEditorProps } from "@/types/component-props";
import type { InvoiceItemFormValues } from "@/types/forms";

export function ItemEditor({ items, onChange, currency = "IDR", disabled }: ItemEditorProps) {
  const update = (idx: number, patch: Partial<InvoiceItemFormValues>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const add = () => {
    onChange([
      ...items,
      { name: "", description: "", quantity: 1, unitPrice: 0, order: items.length },
    ]);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="w-24 p-3 text-right">Qty</th>
              <th className="w-44 p-3 text-right">Harga Satuan</th>
              <th className="w-44 p-3 text-right">Total</th>
              <th className="w-12 p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => {
              const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              return (
                <tr key={idx} className="align-top">
                  <td className="p-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" aria-hidden="true" />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.name}
                      onChange={(e) => update(idx, { name: e.target.value })}
                      placeholder="Contoh: Jasa Desain"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.description ?? ""}
                      onChange={(e) => update(idx, { description: e.target.value })}
                      placeholder="Detail item (opsional)"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => update(idx, { quantity: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                      className="text-right font-mono"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <CurrencyInput
                      value={Number(item.unitPrice) || 0}
                      onChange={(v) => update(idx, { unitPrice: v })}
                      currency={currency}
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-3 text-right font-mono">{formatCurrency(total, currency)}</td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={disabled || items.length <= 1}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label={`Hapus item ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" onClick={add} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Item
      </Button>
    </div>
  );
}