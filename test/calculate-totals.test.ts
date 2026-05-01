import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "@/utils/calculate-totals";

describe("calculateInvoiceTotals", () => {
  it("hitung subtotal dari items", () => {
    const r = calculateInvoiceTotals({
      items: [{ quantity: 2, unitPrice: 1000 }, { quantity: 1, unitPrice: 500 }],
      taxRate: 0,
      discountType: "PERCENTAGE",
      discountValue: 0,
    });
    expect(r.subtotal).toBe(2500);
    expect(r.total).toBe(2500);
  });
  it("apply PPN 11%", () => {
    const r = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 10000 }],
      taxRate: 11,
      discountType: "PERCENTAGE",
      discountValue: 0,
    });
    expect(r.taxAmount).toBe(1100);
    expect(r.total).toBe(11100);
  });
  it("diskon persen mengurangi sebelum pajak", () => {
    const r = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 10000 }],
      taxRate: 11,
      discountType: "PERCENTAGE",
      discountValue: 10,
    });
    expect(r.discountAmount).toBe(1000);
    expect(r.taxAmount).toBe(990);
    expect(r.total).toBe(9990);
  });
  it("diskon fixed", () => {
    const r = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 10000 }],
      taxRate: 0,
      discountType: "FIXED",
      discountValue: 2000,
    });
    expect(r.discountAmount).toBe(2000);
    expect(r.total).toBe(8000);
  });
});
