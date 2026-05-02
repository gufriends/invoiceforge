import type { z } from "zod";
import type {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  clientSchema,
  invoiceItemSchema,
  invoiceBaseSchema,
  paymentSchema,
  companySchema,
} from "@/lib/validations";

// Input types — used as TFieldValues in useForm<TFieldValues, any, TTransformedValues>.
// Fields with .default() become optional (string | undefined) in the input type,
// which is what react-hook-form manages in the DOM before the resolver runs.
export type LoginFormValues = z.input<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
export type ClientFormValues = z.input<typeof clientSchema>;
export type InvoiceItemFormValues = z.input<typeof invoiceItemSchema>;
export type InvoiceFormValues = z.input<typeof invoiceBaseSchema>;
export type PaymentFormValues = z.input<typeof paymentSchema>;
export type CompanyFormValues = z.input<typeof companySchema>;

// Output types — used as TTransformedValues in useForm<..., any, OutputType>.
// These are what the onSubmit callback receives after the zodResolver transforms
// the raw field values (applies defaults, coercion, etc.).
export type ClientFormOutput = z.output<typeof clientSchema>;
export type InvoiceItemFormOutput = z.output<typeof invoiceItemSchema>;
export type InvoiceFormOutput = z.output<typeof invoiceBaseSchema>;
export type PaymentFormOutput = z.output<typeof paymentSchema>;
export type CompanyFormOutput = z.output<typeof companySchema>;
