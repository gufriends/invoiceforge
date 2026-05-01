import { describe, it, expect } from "vitest";
import { formatCurrency, parseCurrency } from "@/utils/format-currency";

describe("formatCurrency", () => {
  it("format IDR dengan prefix Rp", () => {
    expect(formatCurrency(10000)).toBe("Rp 10.000");
  });
  it("compact untuk angka besar", () => {
    expect(formatCurrency(45200000, "IDR", { compact: true })).toContain("45");
  });
  it("USD dengan dollar", () => {
    expect(formatCurrency(100, "USD")).toContain("$");
  });
});

describe("parseCurrency", () => {
  it("parse Rp 10.000", () => {
    expect(parseCurrency("Rp 10.000")).toBe(10000);
  });
});
