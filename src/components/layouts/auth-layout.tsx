import { Receipt, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  "Buat invoice profesional dalam hitungan detik",
  "Kelola klien & riwayat pembayaran di satu tempat",
  "Analitik pendapatan & laporan PPN otomatis",
];

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — OKLCH gradient with mesh */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background: "oklch(0.40 0.20 263)",
        }}
      >
        {/* Mesh radial overlays */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 40%, oklch(0.55 0.22 263 / 0.5) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.35 0.15 280 / 0.6) 0%, transparent 60%)",
          }}
        />

        <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Receipt className="h-5 w-5" />
          </div>
          InvoiceForge
        </Link>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Invoice Profesional,<br />Bisnis Lebih Cuan.
            </h2>
            <p className="mt-3 text-base text-white/70 leading-relaxed">
              Platform invoice & client management untuk freelancer & UMKM Indonesia.
            </p>
          </div>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-white/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© 2026 InvoiceForge. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden flex items-center gap-2.5 text-base font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            InvoiceForge
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-card p-7 shadow-sm ring-1 ring-border">
            <div className="mb-5">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
