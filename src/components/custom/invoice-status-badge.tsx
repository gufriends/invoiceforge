import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants";
import type { InvoiceStatusBadgeProps } from "@/types/component-props";

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

export function InvoiceStatusBadge({ status, size = "md" }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-semibold", INVOICE_STATUS_COLORS[status], sizes[size])}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
