# InvoiceForge — Phase 4: Polish + Deploy

> **PETUNJUK:** Phase 1-3 HARUS sudah 100%.

---

## Daftar Isi
- [Step 1: Dark Mode Implementation](#step-1-dark-mode-implementation)
- [Step 2: Animations (Framer Motion)](#step-2-animations-framer-motion)
- [Step 3: Mobile Responsive](#step-3-mobile-responsive)
- [Step 4: Loading States (Skeleton)](#step-4-loading-states-skeleton)
- [Step 5: Empty States](#step-5-empty-states)
- [Step 6: Error Handling](#step-6-error-handling)
- [Step 7: Mobile Sidebar Drawer](#step-7-mobile-sidebar-drawer)
- [Step 8: Page Transitions](#step-8-page-transitions)
- [Step 9: Keyboard Shortcuts](#step-9-keyboard-shortcuts)
- [Step 10: Testing](#step-10-testing)
- [Step 11: Docker Setup](#step-11-docker-setup)
- [Step 12: CI/CD GitHub Actions](#step-12-cicd-github-actions)
- [Step 13: Production Configuration](#step-13-production-configuration)
- [Step 14: Verifikasi Akhir](#step-14-verifikasi-akhir)

---

## Step 1: Dark Mode Implementation

Dark mode SUDAH di-setup di Phase 1 via `next-themes`. Pastikan:

- [ ] Cek `src/app/layout.tsx` punya `<html suppressHydrationWarning>`
- [ ] Cek `src/components/providers/theme-provider.tsx` ada
- [ ] Cek topbar punya toggle button

### Theme variables tambahan
- [ ] Pastikan SEMUA komponen pakai CSS variables (bg-card, text-foreground, dll), JANGAN hardcode bg-white/text-black
- [ ] Charts (Recharts) → ubah hardcoded warna → pakai variabel CSS atau theme-aware

### File: `src/components/charts/revenue-chart.tsx`
- [ ] Update agar dark mode aware:

```tsx
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { formatCurrency } from "@/utils/format-currency";
import type { RevenueDataPoint } from "@/types/analytics";

const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const formatted = data.map((d) => {
    const [y, m] = d.period.split("-");
    return { ...d, label: `${monthsID[Number(m) - 1]} ${y.slice(2)}` };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" stroke={axisColor} fontSize={12} />
        <YAxis stroke={axisColor} fontSize={12} tickFormatter={(v) => formatCurrency(v, "IDR", { compact: true })} />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), "Pendapatan"]}
          contentStyle={{
            backgroundColor: tooltipBg,
            borderRadius: 8,
            border: `1px solid ${tooltipBorder}`,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] Update `status-distribution.tsx`, `top-clients-chart.tsx`, `payment-method-chart.tsx` dengan pola yang sama (gunakan `useTheme` untuk axis color & tooltip background)

---

## Step 2: Animations (Framer Motion)

### File: `src/components/animations/fade-in.tsx`
- [ ] Buat:

```tsx
"use client";

import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### File: `src/components/animations/count-up.tsx`
- [ ] Buat (untuk number changes):

```tsx
"use client";

import { useEffect, useState } from "react";

export function CountUp({ value, duration = 600, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const diff = value - from;
    let raf: number;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString("id-ID")}</>;
}
```

### Update Dashboard pakai animasi
- [ ] Edit `src/app/(app)/dashboard/page.tsx` — wrap stats grid dengan `Stagger`/`StaggerItem`:

```tsx
import { Stagger, StaggerItem, FadeIn } from "@/components/animations/fade-in";

// Ganti div grid stats:
<Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StaggerItem><StatsCard ... /></StaggerItem>
  <StaggerItem><StatsCard ... /></StaggerItem>
  <StaggerItem><StatsCard ... /></StaggerItem>
  <StaggerItem><StatsCard ... /></StaggerItem>
</Stagger>

// Wrap chart:
<FadeIn delay={0.1}>
  <Card>...</Card>
</FadeIn>
```

### Animasi page transition
- [ ] Buat `src/components/animations/page-transition.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] Wrap `<main>` di `src/app/(app)/layout.tsx`:

```tsx
import { PageTransition } from "@/components/animations/page-transition";

// ...
<main className="flex-1 p-4 lg:p-6">
  <PageTransition>{children}</PageTransition>
</main>
```

---

## Step 3: Mobile Responsive

### Breakpoint policy
- [ ] EXACT breakpoints (Tailwind default):
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

### Aturan EXACT per page

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Dashboard stats | 1 col | 2 col (`sm:grid-cols-2`) | 4 col (`lg:grid-cols-4`) |
| Tables | Horizontal scroll dgn `overflow-x-auto` | Sama | Full width |
| Forms | 1 col fields | 2 col (`sm:grid-cols-2`) | 2 col |
| Sidebar | Drawer (Sheet) | Drawer | Persistent |
| Topbar search | Hidden, tampil di drawer | Visible | Full width |
| Action buttons | Stack vertical | Inline | Inline |

### Update layout `(app)`
- [ ] Edit `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileSidebar } from "@/components/layouts/mobile-sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { PageTransition } from "@/components/animations/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
```

---

## Step 7: Mobile Sidebar Drawer

### File: `src/components/layouts/mobile-sidebar.tsx`
- [ ] Buat:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  Menu,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/reports", label: "Laporan", icon: ClipboardList },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-lg">InvoiceForge</span>
          </Link>
        </div>
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] Update `src/components/layouts/topbar.tsx` agar mobile sidebar trigger ditambahkan (atau disesuaikan margin kiri di mobile):

```tsx
// Tambahkan padding kiri di mobile agar tidak overlap dengan tombol Menu
// Cukup ubah baris <header> ke:
<header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 pl-16 lg:pl-4 lg:px-6">
```

---

## Step 4: Loading States (Skeleton)

### Skeleton patterns EXACT per komponen

#### File: `src/components/custom/loading-skeleton.tsx`
- [ ] EXTEND file ini (tambahkan skeleton lain):

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, c) => <Skeleton key={c} className="h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-md p-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <CardSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}
```

### Penggunaan EXACT per page
- [ ] `dashboard/page.tsx`: `StatsCardSkeleton` × 4 saat `loadingOverview`
- [ ] `invoices/page.tsx` & `clients/page.tsx`: pakai `TableSkeleton rows={6}` saat `isLoading`
- [ ] `invoices/[id]/page.tsx`: pakai `InvoiceDetailSkeleton` saat `isLoading`
- [ ] `analytics/page.tsx`: pakai `ChartSkeleton height={300}` saat data belum ada

---

## Step 5: Empty States

### EXACT message per page

| Page | Title | Description | Icon | Action |
|------|-------|-------------|------|--------|
| `/clients` (no data) | "Belum ada klien" | "Mulai dengan menambah klien pertama kamu" | `Users` | "Tambah Klien" |
| `/clients` (no search result) | "Klien tidak ditemukan" | "Coba kata kunci lain atau hapus filter" | `Search` | none |
| `/invoices` (no data) | "Belum ada invoice" | "Buat invoice pertama untuk klien kamu" | `FileText` | "Buat Invoice" |
| `/invoices` (no search result) | "Invoice tidak ditemukan" | "Coba kata kunci atau filter status lain" | `Search` | none |
| `/dashboard` (zero data) | "Belum ada aktivitas" | "Mulai dengan membuat klien lalu invoice pertama" | `Sparkles` | "Mulai" |
| `/analytics` (zero data) | "Belum ada data analitik" | "Tambah invoice & catat pembayaran agar analitik muncul" | `BarChart3` | none |
| `/reports` (zero data) | "Belum ada laporan" | "Catat pembayaran untuk mulai melihat laporan" | `ClipboardList` | none |
| Client detail (no invoices) | "Belum ada invoice" | "Buat invoice pertama untuk klien ini" | `FileText` | "Buat Invoice" |

### Update EmptyState component
- [ ] Edit `src/components/custom/empty-state.tsx`:

```tsx
import type { EmptyStateProps } from "@/types/component-props";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function EmptyState({ icon: Icon, illustration, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {illustration ? (
        <img src={illustration} alt="" className="w-48 h-48 mb-4 opacity-80" />
      ) : Icon ? (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </motion.div>
  );
}
```

---

## Step 6: Error Handling

### Global error boundary
### File: `src/app/error.tsx`
- [ ] Buat:

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("APP_ERROR", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Ada yang tidak beres</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Terjadi kesalahan di aplikasi. Silakan coba lagi atau kembali ke beranda.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard"><Home className="mr-2 h-4 w-4" /> Beranda</Link>
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}
```

### File: `src/app/not-found.tsx`
- [ ] Buat:

```tsx
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard"><Home className="mr-2 h-4 w-4" /> Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
```

### File: `src/app/(app)/error.tsx`
- [ ] Buat (untuk error di dalam app group):

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("APP_GROUP_ERROR", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">Halaman bermasalah</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{error.message || "Terjadi kesalahan saat memuat halaman ini"}</p>
      <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" /> Muat Ulang</Button>
    </div>
  );
}
```

### Per error type — exact handling

| Error Type | Status | Pesan ID | Action |
|-----------|--------|----------|--------|
| Network error | - | "Koneksi internet bermasalah" | Auto retry 1× |
| Unauthorized | 401 | "Sesi habis, silakan login kembali" | Redirect `/login` |
| Forbidden | 403 | "Kamu tidak punya akses" | Show inline |
| Not Found | 404 | "Data tidak ditemukan" | Show empty state |
| Validation | 400 | Pesan dari API | Show inline form error |
| Server Error | 500 | "Terjadi kesalahan server, coba lagi nanti" | Show toast |

### Update `apiFetch` agar handle 401 redirect:
- [ ] Edit `src/lib/api-client.ts`:

```ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Sesi habis, silakan login kembali");
  }

  let json: any;
  try { json = await res.json(); } catch { json = null; }

  if (!res.ok) {
    throw new Error(json?.message ?? "Terjadi kesalahan");
  }
  return json.data as T;
}
```

---

## Step 8: Page Transitions

(Sudah dibuat di Step 2 — `PageTransition` component & dipasang di `(app)/layout.tsx`)

- [ ] Verifikasi: pindah antar halaman → ada fade transition halus

---

## Step 9: Keyboard Shortcuts

### File: `src/hooks/use-keyboard-shortcuts.ts`
- [ ] Buat:

```ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInputFocused) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "k") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder*="Cari"]');
        search?.focus();
        return;
      }
      if (e.key === "g") {
        const next = (path: string) => router.push(path);
        const sub = (e2: KeyboardEvent) => {
          if (e2.key === "d") next("/dashboard");
          else if (e2.key === "i") next("/invoices");
          else if (e2.key === "c") next("/clients");
          else if (e2.key === "a") next("/analytics");
          else if (e2.key === "r") next("/reports");
          else if (e2.key === "s") next("/settings");
          window.removeEventListener("keydown", sub);
        };
        window.addEventListener("keydown", sub, { once: true });
      }
      if (e.key === "n" && !ctrl) {
        e.preventDefault();
        if (window.location.pathname.includes("/invoices")) router.push("/invoices/create");
        else if (window.location.pathname.includes("/clients")) router.push("/clients/create");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
```

- [ ] Pasang di `src/app/(app)/layout.tsx` (gunakan client component wrapper):

### File: `src/components/layouts/keyboard-shortcuts.tsx`
- [ ] Buat:

```tsx
"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcuts() {
  useKeyboardShortcuts();
  return null;
}
```

- [ ] Tambahkan `<KeyboardShortcuts />` di `(app)/layout.tsx`

---

## Step 10: Testing

### File: `vitest.config.ts`
- [ ] Buat di root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### File: `test/setup.ts`
- [ ] Buat:

```ts
import "@testing-library/jest-dom/vitest";
```

### File: `test/format-currency.test.ts`
- [ ] Buat:

```ts
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
```

### File: `test/calculate-totals.test.ts`
- [ ] Buat:

```ts
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
```

### File: `test/generate-invoice-number.test.ts`
- [ ] Buat:

```ts
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
```

- [ ] Run: `npm test`

---

## Step 11: Docker Setup

### File: `Dockerfile`
- [ ] Buat di root:

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

### File: `next.config.ts`
- [ ] UPDATE: tambahkan `output: "standalone"`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
```

### File: `.dockerignore`
- [ ] Buat:

```
node_modules
.next
.env*.local
.git
.gitignore
docs
test
*.md
prisma/dev.db
prisma/dev.db-journal
.DS_Store
```

### File: `docker-compose.yml`
- [ ] Buat di root:

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: invoiceforge
      POSTGRES_USER: invoiceforge
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoiceforge"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://invoiceforge:${POSTGRES_PASSWORD:-changeme}@db:5432/invoiceforge?schema=public
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: ${AUTH_URL:-http://localhost:3000}
      NEXTAUTH_URL: ${AUTH_URL:-http://localhost:3000}
      NEXT_PUBLIC_APP_URL: ${AUTH_URL:-http://localhost:3000}
    ports:
      - "3000:3000"
    command: sh -c "npx prisma migrate deploy && node server.js"

volumes:
  pgdata:
```

### Switch ke PostgreSQL untuk production
- [ ] Buat `prisma/schema.production.prisma` (copy dari `schema.prisma`):
  - Ubah `provider = "postgresql"` saja, sisa schema sama
- [ ] Tambahkan script di `package.json`: `"db:migrate:prod": "prisma migrate deploy"`
- [ ] Untuk production, ganti datasource ke postgresql:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 12: CI/CD GitHub Actions

### File: `.github/workflows/ci.yml`
- [ ] Buat:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --run

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx prisma generate

      - name: Build
        env:
          DATABASE_URL: file:./build.db
          AUTH_SECRET: dummy-secret-for-build-only-32chars
          AUTH_URL: http://localhost:3000
          NEXTAUTH_URL: http://localhost:3000
        run: |
          npx prisma db push --skip-generate
          npm run build

  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        run: docker build -t invoiceforge:latest .
```

### File: `.github/workflows/deploy.yml`
- [ ] Buat (deploy stub — sesuaikan dengan provider):

```yaml
name: Deploy

on:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploy step disesuaikan dengan provider (Vercel/Railway/VPS)"
```

---

## Step 13: Production Configuration

### File: `.env.production.example`
- [ ] Buat:

```env
# Database (PostgreSQL untuk production)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/invoiceforge?schema=public"

# NextAuth
AUTH_SECRET="GANTI-DENGAN-SECRET-KUAT-MIN-32-CHAR"
AUTH_URL="https://invoiceforge.id"
NEXTAUTH_URL="https://invoiceforge.id"

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@invoiceforge.id"

# App
NEXT_PUBLIC_APP_URL="https://invoiceforge.id"
NEXT_PUBLIC_APP_NAME="InvoiceForge"

# Production flags
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Security headers
### File: `next.config.ts`
- [ ] UPDATE final:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Robots & sitemap
### File: `src/app/robots.ts`
- [ ] Buat:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/invoices/", "/clients/", "/settings/"] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sitemap.xml`,
  };
}
```

---

## Step 14: Verifikasi Akhir

### Checklist UI
- [ ] Toggle dark mode → semua page (dashboard, invoices, clients, analytics, reports, settings) tampil baik
- [ ] Resize ke mobile (375px):
  - [ ] Sidebar jadi drawer (hamburger button)
  - [ ] Stats card jadi 1 kolom
  - [ ] Form jadi 1 kolom
  - [ ] Table scroll horizontal
- [ ] Resize ke tablet (768px):
  - [ ] Stats card jadi 2 kolom
  - [ ] Form jadi 2 kolom
- [ ] Animations:
  - [ ] Pindah halaman → fade transition
  - [ ] Stats card muncul stagger di dashboard
  - [ ] Empty state animasi scale
- [ ] Loading states:
  - [ ] Refresh halaman → skeleton tampil sebelum data load
- [ ] Empty states:
  - [ ] User baru → dashboard tampil empty state dengan CTA
  - [ ] Clients page kosong → empty state
- [ ] Error states:
  - [ ] Buka URL tidak ada (`/xxx`) → 404 page
  - [ ] Buka invoice ID tidak ada → error page

### Checklist Code Quality
- [ ] `npm run build` sukses tanpa error
- [ ] `npx tsc --noEmit` sukses
- [ ] `npm test` semua hijau
- [ ] Tidak ada `console.log` yang tertinggal di production code

### Checklist Deploy
- [ ] `Dockerfile` build sukses: `docker build -t invoiceforge .`
- [ ] `docker-compose up` berhasil run app + postgres
- [ ] CI workflow GitHub bisa dijalankan
- [ ] Environment variables documented di `.env.production.example`

### Checklist Performance
- [ ] Lighthouse score > 90 di Desktop:
  - [ ] Performance
  - [ ] Accessibility
  - [ ] Best Practices
  - [ ] SEO
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### Checklist Aksesibilitas
- [ ] Semua tombol bisa di-tab dengan keyboard
- [ ] Semua input punya label
- [ ] Color contrast cukup (WCAG AA)
- [ ] Focus indicator visible

---

## Checklist Final Phase 4

- [ ] Dark mode bekerja di semua komponen
- [ ] Animasi page transition + stagger di dashboard selesai
- [ ] Mobile responsive bekerja (sidebar drawer, grid responsive)
- [ ] Skeleton loaders di semua page yang fetch data
- [ ] Empty states dengan exact message untuk semua scenario
- [ ] Error pages (`error.tsx`, `not-found.tsx`) selesai
- [ ] Keyboard shortcuts bekerja (Ctrl+K search, g+d navigate, n create)
- [ ] Unit tests minimal 3 file (currency, totals, invoice number)
- [ ] Dockerfile + docker-compose.yml selesai
- [ ] GitHub Actions CI workflow selesai
- [ ] Production config (security headers, env example) selesai
- [ ] **APLIKASI SIAP DEPLOY** ✅
