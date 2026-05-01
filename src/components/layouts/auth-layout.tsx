import { Receipt } from "lucide-react";
import Link from "next/link";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-secondary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Receipt className="h-6 w-6" />
          </div>
          InvoiceForge
        </Link>
        <div>
          <h2 className="text-4xl font-bold mb-4">Invoice Profesional, Bisnis Lebih Cuan.</h2>
          <p className="text-lg text-white/80">
            Platform invoice & client management untuk freelancer & UMKM Indonesia.
          </p>
        </div>
        <div className="text-sm text-white/60">© 2026 InvoiceForge. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2 text-xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Receipt className="h-6 w-6" />
            </div>
            InvoiceForge
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}