import { describe, it, expect } from "vitest";
import { generateInvoiceNumber } from "@/utils/generate-invoice-number";

describe("generateInvoiceNumber", () => {
  it("format INV-YYYY-XXXX", () => {
    expect(generateInvoiceNumber("INV", 2026, 1)).toBe("INV-2026-0001");
    expect(generateInvoiceNumber("INV", 2026, 1234)).toBe("INV-2026-1234");
  });
  it("custom prefix", () => {
    expect(generateInvoiceNumber("SDS", 2026, 5)).toBe("SDS-2026-0005");
  });
});
