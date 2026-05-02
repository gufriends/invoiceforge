"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { INVOICE_TEMPLATE_DETAILS, INVOICE_TEMPLATES, type InvoiceTemplate } from "@/lib/constants";

interface Props {
  value: InvoiceTemplate;
  onChange: (value: InvoiceTemplate) => void;
}

export function TemplateSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {INVOICE_TEMPLATES.map((id) => {
        const t = INVOICE_TEMPLATE_DETAILS[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col overflow-hidden rounded-lg border-2 text-left transition-all",
              selected
                ? "border-primary shadow-sm ring-2 ring-primary/20"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/30">
              <Image
                src={t.thumbnail}
                alt={t.label}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.label}</span>
                {selected && (
                  <span className="h-4 w-4 rounded-full border-[3px] border-primary bg-primary/20" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
