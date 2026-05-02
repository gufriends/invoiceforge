import { z } from "zod";
import {
  INVOICE_STATUSES,
  INVOICE_TEMPLATES,
  PAYMENT_METHODS,
  DISCOUNT_TYPES,
  RECURRING_CYCLES,
  CURRENCIES,
} from "@/lib/constants";

// AUTH
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus ada huruf kapital")
      .regex(/[a-z]/, "Password harus ada huruf kecil")
      .regex(/[0-9]/, "Password harus ada angka"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Kamu harus menyetujui syarat & ketentuan" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus ada huruf kapital")
      .regex(/[0-9]/, "Password harus ada angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

// CLIENT
export const clientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().max(20).optional().or(z.literal("")),
  company: z.string().max(150).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  country: z.string().default("Indonesia"),
  npwp: z
    .string()
    .regex(/^(\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3})?$/, "Format NPWP: XX.XXX.XXX.X-XXX.XXX")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// INVOICE ITEM
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama item wajib diisi").max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  order: z.number().int().default(0),
});

// INVOICE
export const invoiceBaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Nomor invoice wajib diisi").max(50),
  clientId: z.string().min(1, "Pilih klien terlebih dahulu"),
  issueDate: z.coerce.date({ required_error: "Tanggal terbit wajib diisi" }),
  dueDate: z.coerce.date({ required_error: "Tanggal jatuh tempo wajib diisi" }),
  template: z.enum(INVOICE_TEMPLATES).default("modern"),
  items: z.array(invoiceItemSchema).min(1, "Minimal 1 item"),
  taxRate: z.coerce.number().min(0).max(100).default(11),
  discountType: z.enum(DISCOUNT_TYPES).default("PERCENTAGE"),
  discountValue: z.coerce.number().min(0).default(0),
  notes: z.string().max(1000).optional().or(z.literal("")),
  terms: z.string().max(1000).optional().or(z.literal("")),
  isRecurring: z.boolean().default(false),
  recurringCycle: z.enum(RECURRING_CYCLES).nullable().default(null),
});

export const invoiceSchema = invoiceBaseSchema.refine(
  (data) => data.dueDate >= data.issueDate,
  {
    message: "Tanggal jatuh tempo harus setelah atau sama dengan tanggal terbit",
    path: ["dueDate"],
  }
);

// PAYMENT
export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Jumlah pembayaran harus lebih dari 0"),
  method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: "Pilih metode pembayaran" }) }),
  date: z.coerce.date({ required_error: "Tanggal pembayaran wajib diisi" }),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// COMPANY
const optStr = (max = 500) => z.string().max(max).optional().or(z.literal("")).nullable().transform((v) => v ?? "");

export const companySchema = z.object({
  name: z.string().min(2, "Nama perusahaan minimal 2 karakter").max(150),
  logo: optStr(),
  address: optStr(500),
  city: optStr(100),
  province: optStr(100),
  postalCode: optStr(10),
  country: z.string().default("Indonesia"),
  phone: optStr(20),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable().transform((v) => v ?? ""),
  website: z.string().url("Format URL tidak valid").optional().or(z.literal("")).nullable().transform((v) => v ?? ""),
  npwp: optStr(),
  bankName: optStr(100),
  bankAccount: optStr(50),
  bankHolder: optStr(150),
  invoicePrefix: z.string().min(1).max(10).default("INV"),
  invoiceTemplate: z.enum(INVOICE_TEMPLATES).default("modern"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna #RRGGBB").default("#2563eb"),
  currency: z.enum(CURRENCIES).default("IDR"),
  taxRate: z.coerce.number().min(0).max(100).default(11),
});