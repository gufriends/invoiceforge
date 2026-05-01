import type { CalculateInvoiceTotalsFn, InvoiceTotals } from "@/types";

export const calculateInvoiceTotals: CalculateInvoiceTotalsFn = ({
  items,
  taxRate,
  discountType,
  discountValue,
}): InvoiceTotals => {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  let discountAmount = 0;
  if (discountType === "PERCENTAGE") {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  if (discountAmount > subtotal) discountAmount = subtotal;

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    taxableAmount: Math.round(taxableAmount),
    taxAmount: Math.round(taxAmount),
    total: Math.round(total),
  };
};