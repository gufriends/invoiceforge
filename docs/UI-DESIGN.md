# InvoiceForge — UI/UX Design Specs

Dokumen ini mendefinisikan **design system** dan **layout setiap halaman** InvoiceForge. Pasangkan dengan `docs/COMPONENTS.md` (kontrak komponen).

---

## Daftar Isi
1. [Design Principles](#design-principles)
2. [Design System](#design-system)
   - [Colors](#colors)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Border Radius & Shadow](#border-radius--shadow)
   - [Iconography](#iconography)
   - [Motion](#motion)
3. [Theme Tokens (CSS variables)](#theme-tokens-css-variables)
4. [Responsive Breakpoints](#responsive-breakpoints)
5. [Layout Patterns](#layout-patterns)
6. [Per-page Spec](#per-page-spec)
7. [Empty / Error / Loading States](#empty--error--loading-states)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Microcopy Style](#microcopy-style)
10. [Animation & Transition Library](#animation--transition-library)

---

## Design Principles

1. **Tenang & profesional** — minimalis, banyak whitespace, bukan playful.
2. **Data-first** — angka & tabel terlihat jelas; gunakan tabular-nums.
3. **Setiap aksi punya feedback** — loading, success, error, undo.
4. **Hierarki yang jelas** — ukuran, weight, dan warna membentuk fokus.
5. **Konsisten** — token sentral, jangan ada `bg-blue-500` ad-hoc.
6. **Inclusive** — WCAG AA, dark mode, screen reader friendly.

---

## Design System

### Colors

Pakai sistem **HSL** dengan CSS variables. Berikut palet brand:

#### Primary (Brand)
```
50:  hsl(214 100% 97%)   — #EFF6FF
100: hsl(214 95% 93%)    — #DBEAFE
200: hsl(213 97% 87%)    — #BFDBFE
300: hsl(212 96% 78%)    — #93C5FD
400: hsl(213 94% 68%)    — #60A5FA
500: hsl(217 91% 60%)    — #3B82F6
600: hsl(221 83% 53%)    — #2563EB  ← DEFAULT
700: hsl(224 76% 48%)    — #1D4ED8
800: hsl(226 71% 40%)    — #1E40AF
900: hsl(224 64% 33%)    — #1E3A8A
```

#### Semantic
```
Success: hsl(142 71% 45%)  — #16A34A   (PAID, positive growth)
Warning: hsl(25 95% 53%)   — #F97316   (OVERDUE)
Danger:  hsl(0 84% 60%)    — #EF4444   (Cancelled, error)
Info:    hsl(199 89% 48%)  — #0EA5E9   (Sent, informational)
```

#### Neutrals (Slate)
```
50:  hsl(210 40% 98%)
100: hsl(210 40% 96%)
200: hsl(214 32% 91%)
300: hsl(213 27% 84%)
400: hsl(215 20% 65%)
500: hsl(215 16% 47%)
600: hsl(215 19% 35%)
700: hsl(215 25% 27%)
800: hsl(217 33% 17%)
900: hsl(222 47% 11%)
```

#### Status colors (untuk badge invoice)
| Status | Light | Dark |
|--------|-------|------|
| DRAFT | slate-200 / slate-700 | slate-800 / slate-300 |
| SENT | blue-100 / blue-700 | blue-900 / blue-300 |
| VIEWED | cyan-100 / cyan-700 | cyan-900 / cyan-300 |
| PARTIAL | amber-100 / amber-700 | amber-900 / amber-300 |
| PAID | green-100 / green-700 | green-900 / green-300 |
| OVERDUE | red-100 / red-700 | red-900 / red-300 |
| CANCELLED | slate-100 strikethrough | slate-800 strikethrough |

#### Chart palette
5 warna primer untuk chart:
```
chart-1: hsl(221 83% 53%)
chart-2: hsl(199 89% 48%)
chart-3: hsl(142 71% 45%)
chart-4: hsl(25 95% 53%)
chart-5: hsl(266 67% 58%)
```

### Typography

#### Font stack
- **Heading & body:** **Inter** (variable). Fallback: `system-ui, -apple-system, sans-serif`.
- **Mono (currency, code):** **JetBrains Mono**. Fallback: `ui-monospace, monospace`.

Self-host font (lihat `public/fonts/`) untuk privacy & performance.

#### Type scale (1.25 — Major Third)
| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| 2xs | 10px | 14px | 500 | Caption, footnote |
| xs | 12px | 16px | 500 | Helper text, badges |
| sm | 14px | 20px | 400 | Body small, table cell |
| base | 16px | 24px | 400 | Body default |
| lg | 18px | 28px | 500 | Subheading |
| xl | 20px | 30px | 600 | Card title |
| 2xl | 24px | 32px | 600 | Section heading |
| 3xl | 30px | 36px | 700 | Page heading |
| 4xl | 36px | 40px | 700 | Display heading |
| 5xl | 48px | 48px | 800 | Hero (landing) |

#### Tabular numbers
Untuk angka uang: `font-variant-numeric: tabular-nums`. Tambah class util `.tabular-nums`.

### Spacing

Base unit: **4px**.

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Within compact UI |
| sm | 8px | Default form gap |
| md | 16px | Section padding |
| lg | 24px | Card padding |
| xl | 32px | Section margin |
| 2xl | 48px | Page section break |
| 3xl | 64px | Hero spacing |

### Border Radius & Shadow

#### Radius
| Token | Value | Use |
|-------|-------|-----|
| sm | 6px | Badge, chip |
| md | 8px | Input, button (DEFAULT) |
| lg | 12px | Card |
| xl | 16px | Dialog, modal |
| 2xl | 24px | Hero card |
| full | 9999px | Avatar, pill |

#### Shadow elevation (light mode)
```
soft-sm:  0 1px 2px 0  rgb(0 0 0 / 0.04)
soft:     0 2px 8px -2px rgb(0 0 0 / 0.06)
soft-md:  0 4px 16px -4px rgb(0 0 0 / 0.08)
soft-lg:  0 8px 32px -8px rgb(0 0 0 / 0.12)
soft-xl:  0 16px 48px -16px rgb(0 0 0 / 0.16)
```

Dark mode pakai overlay 5–10% white untuk elevation (bukan shadow).

### Iconography
- Library: **Lucide React** (`lucide-react`).
- Stroke 1.5–2 (default 2).
- Ukuran standar: 16, 20, 24 px.
- Icon harus pakai `aria-hidden="true"` jika dekoratif.

### Motion
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard).
- **Duration:**
  - Micro (focus, hover): 100–150ms
  - Component (dialog, drawer open): 200–250ms
  - Page transition: 300ms
- **Reduce motion:** respect `prefers-reduced-motion` (disable animasi).

---

## Theme Tokens (CSS variables)

`src/styles/theme.css` (excerpt):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --primary-50: 214 100% 97%;
    --primary-100: 214 95% 93%;
    /* ... */

    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;

    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;

    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 25 95% 53%;
    --warning-foreground: 0 0% 100%;
    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;

    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;

    --radius: 0.5rem;

    --chart-1: 221 83% 53%;
    --chart-2: 199 89% 48%;
    --chart-3: 142 71% 45%;
    --chart-4: 25 95% 53%;
    --chart-5: 266 67% 58%;

    --status-draft: 215 16% 47%;
    --status-sent: 221 83% 53%;
    --status-viewed: 199 89% 48%;
    --status-partial: 38 92% 50%;
    --status-paid: 142 71% 45%;
    --status-overdue: 0 84% 60%;
    --status-cancelled: 215 16% 47%;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    /* ... mapping dark */
    --card: 217 33% 14%;
    --card-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --border: 217 33% 22%;
    --input: 217 33% 22%;
  }
}
```

**Aturan penggunaan:**
- Selalu pakai token (`bg-primary`, `text-foreground`).
- Hindari literal warna (`bg-blue-500`).
- Untuk warna brand utama, pakai `--primary` saja, varian shade pakai `--primary-50` … `--primary-900`.

---

## Responsive Breakpoints

Mengikuti Tailwind default:

| Token | Min width | Target |
|-------|-----------|--------|
| sm | 640px | Mobile besar / phablet |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / laptop kecil |
| xl | 1280px | Desktop |
| 2xl | 1536px | Wide desktop |

**Strategi mobile-first:** mulai dari mobile, tambah `md:`/`lg:` untuk desktop.

---

## Layout Patterns

### App layout (authenticated)

```
┌────────────────────────────────────────────────────┐
│ TopBar (sticky, h=56px)                            │
│ ┌──────┐ ┌──────────────────────┐ ┌─────────────┐ │
│ │ Logo │ │ Search (Cmd+K)       │ │ Actions     │ │
│ └──────┘ └──────────────────────┘ └─────────────┘ │
├────────┬───────────────────────────────────────────┤
│        │                                           │
│ Side   │   Main Content (max-w-7xl, p=24px)        │
│ bar    │                                           │
│ 240px  │                                           │
│ (col-  │                                           │
│ lap-   │                                           │
│ sible  │                                           │
│ 64px)  │                                           │
│        │                                           │
└────────┴───────────────────────────────────────────┘
```

#### Mobile (< md)
- Sidebar disembunyikan, jadi **drawer** dari kiri.
- Topbar: hamburger menu, logo center, action right.
- Main content: padding 16px.

### Auth layout (public)

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│  Gradient            │   Card 400px max     │
│  illustration        │   ┌────────────────┐ │
│  + brand message     │   │ Form           │ │
│  (hidden on mobile)  │   │  Email         │ │
│                      │   │  Password      │ │
│                      │   │  [Submit]      │ │
│                      │   └────────────────┘ │
│                      │   Footer link        │
└──────────────────────┴──────────────────────┘
```

### Public invoice layout

```
┌────────────────────────────────────────────────┐
│ Mini header (logo, status badge)              │
├────────────────────────────────────────────────┤
│                                                │
│   Invoice card (max-w-3xl, centered)           │
│   - Company info                               │
│   - Invoice info                               │
│   - Items table                                │
│   - Totals                                     │
│                                                │
│   [Download PDF] [Pay Now (future)]            │
└────────────────────────────────────────────────┘
```

---

## Per-page Spec

### 1. `/login`

**Layout:** Auth layout, two-column.

**Form fields:**
- Email (autofocus, type=email, autocomplete=email)
- Password (type=password, autocomplete=current-password, show/hide toggle)
- "Ingat saya" checkbox (opsional)
- [Masuk] button (full-width primary)

**Tambahan:**
- "Lupa password?" link → `/forgot-password`
- Divider "atau"
- [Lanjutkan dengan Google] button (jika OAuth aktif)
- "Belum punya akun? Daftar" → `/register`

**Mobile:** kolom kiri (illustration) hidden, form full-width.

**A11y:** label visible (atau sr-only dengan placeholder), error inline.

### 2. `/register`

**Form fields:**
- Nama Lengkap
- Nama Bisnis (akan jadi nama Company default)
- Email
- Password (strength meter)
- Konfirmasi Password
- ☐ Saya setuju [Syarat & Ketentuan] dan [Kebijakan Privasi]
- [Daftar Akun] button

**Validation real-time:**
- Email format
- Password strength: minimum 8 char, ada huruf, angka, simbol
- Password match

### 3. `/forgot-password` & `/reset-password`

Form sederhana — Email input → "Kirim link reset" → success state ("Cek email Anda").

`/reset-password?token=...` — New password + confirm → "Reset Password" → redirect `/login`.

### 4. `/dashboard`

```
┌──────────────────────────────────────────────────────────┐
│ Header: "Halo, Budi 👋"   [+ Buat Invoice] (CTA primary) │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Revenue  │ │ Invoice  │ │ Klien    │ │ Overdue  │    │
│ │ Rp 45,2M │ │ 24 Aktif │ │ 18 Aktif │ │ 3 Telat  │    │
│ │ ↑ 12.5%  │ │ 8 Draft  │ │ +3 bulan │ │ Rp 8,5M  │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐ ┌─────────────────────┐  │
│ │ Pendapatan 12 Bulan        │ │ Invoice Akan Tempo  │  │
│ │ [Area chart Recharts]      │ │ - INV-024 (3h)      │  │
│ │                            │ │ - INV-025 (5h)      │  │
│ │                            │ │ - INV-026 (7h)      │  │
│ └────────────────────────────┘ └─────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│ Invoice Terkini             [Lihat semua →]              │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ # | Klien | Jumlah | Status | Terbit | ⋮            │ │
│ │ ...10 baris...                                       │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**
- Stats clickable → navigate ke filter list.
- Chart toggle: "Pendapatan" vs "Jumlah Invoice".
- Range selector: 7H / 30H / 90H / Tahun ini.

### 5. `/invoices` (List)

**Header:** Judul "Invoice" + tombol "+ Buat Invoice".

**Toolbar:**
```
┌───────────────────────────────────────────────────────┐
│ [🔍 Cari nomor / klien]  [Filter ▾] [Tanggal ▾] [⋮]   │
│                                          [Bulk: 3] →  │
└───────────────────────────────────────────────────────┘
```

**Status filter chip:**
`[Semua] [Draft] [Terkirim] [Dibayar] [Telat] [Dibatalkan]` — clickable chips, active terhighlight.

**Table:**
| ☐ | # | Klien | Tgl Terbit | Tempo | Status | Total | Action |
|---|---|-------|-----------|-------|--------|-------|--------|

- Sort: # (default desc), Tempo, Total.
- Hover row: subtle bg + actions visible.
- Click row → navigate ke detail.
- Bulk actions: Hapus, Tandai sudah dikirim, Export CSV.

**Pagination:** bottom — "1–20 dari 142" + buttons.

**Empty state:** illustration "Belum ada invoice" + CTA.

### 6. `/invoices/create` & `/invoices/:id/edit`

**Layout:** Two-column di desktop (form kiri 60%, preview kanan 40% sticky). Single-column di mobile.

**Form sections (accordion di mobile):**

#### Section 1 — Info Invoice
- Nomor (auto-generated, editable, ada tombol "Ulangi" untuk regenerate)
- Tanggal Terbit (date picker, default hari ini)
- Jatuh Tempo (date picker, default issue + paymentTerms)
- Currency (select, default IDR dari company)
- Template (3 cards: Modern, Classic, Minimal — preview thumbnail)

#### Section 2 — Klien
- ClientSelect (search + create inline)
- Setelah pilih: tampilkan info klien (nama, alamat, NPWP) sebagai card preview readonly.

#### Section 3 — Item
- Tabel ItemEditor (Nama, Deskripsi, Qty, Unit, Harga, Diskon, ☐ Pajak, Total)
- "+ Tambah Item" link bottom
- Drag to reorder via icon ⠿ di kiri tiap row
- Mobile: tiap item collapse jadi card

#### Section 4 — Diskon, Pajak, Pengiriman
- Diskon: tipe (Persentase / Tetap) + nilai
- PPN: dari company default, editable
- Pengiriman: nominal (opsional)

#### Section 5 — Catatan & Syarat
- Notes (textarea, placeholder dari company default)
- Terms (textarea)

#### Section 6 — Recurring (toggle)
- ☐ Buat invoice berulang
- Jika aktif: cycle (Minggu/Bulan/dll), tanggal akhir (opsional)

**Sticky bottom bar (mobile) / sidebar (desktop):**
```
Subtotal:  Rp 12.500.000
Diskon:    -Rp 0
PPN 11%:   Rp 1.375.000
─────────────────────────
TOTAL:     Rp 13.875.000

[Simpan Draft]  [Kirim →]
```

**Behavior:**
- Auto-save draft setiap 30 detik (jika ada perubahan).
- Validation inline.
- "Kirim" → konfirmasi modal: "Kirim ke email@klien?" → kirim.

### 7. `/invoices/:id` (Detail)

```
┌──────────────────────────────────────────────────────────┐
│ ← Kembali     INV-2026-0024     [Status: PAID]           │
│                            [Edit][Kirim][PDF][⋮]         │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐ ┌─────────────────────┐ │
│ │  Invoice Preview              │ │  Pembayaran         │ │
│ │  (full render seperti PDF)    │ │  ┌──────────────┐  │ │
│ │                               │ │  │ 28 Apr       │  │ │
│ │                               │ │  │ Rp 5.000.000 │  │ │
│ │                               │ │  │ Bank Transfer│  │ │
│ │                               │ │  └──────────────┘  │ │
│ │                               │ │  [+ Catat]         │ │
│ │                               │ │                     │ │
│ │                               │ │  Aktivitas          │ │
│ │                               │ │  ✅ Dibuat 25 Apr   │ │
│ │                               │ │  📤 Dikirim 26 Apr  │ │
│ │                               │ │  👁 Dilihat 27 Apr  │ │
│ │                               │ │  💰 Dibayar 28 Apr  │ │
│ └──────────────────────────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Action menu (⋮):**
- Duplikat
- Bagikan link publik (copy link)
- Tandai sebagai...
- Batalkan
- Hapus (DRAFT only)

**Mobile:** preview di atas, sidebar (pembayaran + aktivitas) di bawah dalam tab.

### 8. `/clients` (List)

Table:
| Nama | Perusahaan | Email | Telepon | Total Invoice | Pendapatan | Status | ⋮ |

- Search (nama, perusahaan, email)
- Filter: Aktif/Non-aktif, Tag
- "+ Tambah Klien" button.

### 9. `/clients/:id` (Detail)

```
┌──────────────────────────────────────────────────────────┐
│ ← Kembali    PT ABC Sejahtera     [Edit] [⋮]             │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐ ┌──────────────────────┐  │
│ │ Info klien                 │ │ Stats                │  │
│ │ - Email, Telp              │ │ - Total Invoice: 12  │  │
│ │ - Alamat                   │ │ - Pendapatan: 145M   │  │
│ │ - NPWP                     │ │ - Outstanding: 15M   │  │
│ │ - Tags                     │ │ - Avg Pay: 18 hari   │  │
│ └────────────────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│ Tabs: [Invoice] [Pembayaran] [Catatan]                   │
│                                                          │
│ Invoice list (filterable per status)                     │
└──────────────────────────────────────────────────────────┘
```

### 10. `/analytics`

**Filter bar:** Date range picker (preset + custom), Currency selector.

**Sections:**
1. KPI cards (sama dengan dashboard, tapi adjustable range).
2. **Pendapatan over time** (Area chart, granularity day/week/month).
3. **Distribusi Status Invoice** (Donut chart).
4. **Top 10 Klien** (Bar chart horizontal).
5. **Distribusi Metode Pembayaran** (Pie chart).
6. **Rata-rata Hari Pembayaran** (single big number + trend).
7. **Perbandingan Bulan Ini vs Bulan Lalu** (table).

### 11. `/reports`

Tabs:
- **Pendapatan** — table per periode + total + export CSV/PDF
- **Pajak** (PPN) — list invoice taxable + total tax + export PDF
- **Aging Piutang** — bucket 0/30/60/90+ + drill down per klien
- **Statement Klien** — pilih klien → generate PDF statement

### 12. `/settings`

Sub-pages (sidebar tab):
- **Profil** — nama, email, avatar, ganti password
- **Perusahaan** — semua field Company (lihat schema)
- **Invoice** — prefix, template default, color, payment terms, default notes/terms
- **Notifikasi** — toggle email notifications
- **Keamanan** — sesi aktif, audit log, API keys
- **Integrasi** (future) — Resend, Slack, Zapier
- **Tagihan** (future, jika SaaS plan)

---

## Empty / Error / Loading States

### Empty
Setiap list view harus punya empty state custom:

| Page | Illustration | Title | Action |
|------|--------------|-------|--------|
| Invoices | document-empty | "Belum ada invoice" | "+ Buat Invoice" |
| Clients | people-empty | "Belum ada klien" | "+ Tambah Klien" |
| Analytics | chart-empty | "Belum ada data" | (link ke create invoice) |
| Notifications | bell-empty | "Tidak ada notifikasi" | (none) |

### Error
- **Inline error** (form): merah border + ikon ⚠ + pesan di bawah field.
- **Page error** (500): card dengan ikon 😵 + "Ada yang tidak beres" + "Coba lagi" + "Hubungi support".
- **API error toast** (transient): sonner toast 5 detik.

### Loading
- **Skeleton** (preferred): bentuk mirip konten yang akan tampil.
- **Spinner**: hanya untuk action button atau small area.
- **Page-level loading**: Next.js `loading.tsx` (suspense boundary).

---

## Accessibility Guidelines

### Wajib
- Semua interactive reachable via keyboard.
- Focus ring 2px solid `--ring`, offset 2px.
- Form input: visible label (atau sr-only + visible placeholder OK).
- Required field: `aria-required="true"`, indikator visual `*`.
- Error: `aria-invalid="true"` + `aria-describedby` ke pesan error.
- Form submit dengan kesalahan: scroll ke field pertama yang error + focus.
- Toast: `role="status"` (info) atau `role="alert"` (error).
- Modal: focus trap; close via Esc; restore focus on close.
- Color tidak boleh jadi satu-satunya pembeda (gunakan ikon + text).

### Kontras
- Body text ≥ 4.5:1.
- Large text (≥ 18px regular / 14px bold) ≥ 3:1.
- Interactive components ≥ 3:1.
- Tools: Stark plugin / `axe-core` di dev.

### Screen reader
- Page title via `<title>` atau `useDocumentTitle`.
- Landmark: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- Skip link "Lewati ke konten utama" sebagai elemen pertama.
- Status update region (`aria-live="polite"`) untuk dynamic count.

---

## Microcopy Style

### Tone
- Ramah, profesional, jelas.
- Bahasa Indonesia kasual-formal (tidak terlalu kaku).
- Hindari jargon teknis tanpa konteks.

### Contoh
| Konteks | Buruk | Baik |
|---------|-------|------|
| Empty state | "No data" | "Belum ada invoice. Yuk buat yang pertama!" |
| Error 500 | "Internal server error" | "Ada yang tidak beres. Tim kami sudah dapat notifikasi, coba lagi sebentar." |
| Validation | "Invalid email" | "Format email kurang tepat" |
| Confirmation | "Are you sure?" | "Yakin hapus invoice ini? Aksi tidak bisa dibatalkan." |
| Success | "Done" | "Invoice berhasil terkirim ke {email}." |

### Button labels
- **Verb + Noun** lebih baik daripada generic "OK"/"Submit".
- Contoh: "Simpan Draft", "Kirim Invoice", "Catat Pembayaran".

### Numbers
- Currency: `Rp1.500.000` (titik sebagai ribuan, locale id-ID).
- Tanggal: `30 April 2026` (atau `30 Apr 2026` untuk space-constrained).
- Relative: "3 hari yang lalu", "dalam 5 hari".

---

## Animation & Transition Library

### Built-in animations (Tailwind config)
- `animate-fade-in` — opacity 0 → 1
- `animate-fade-in-up` — opacity 0 + translateY 10px → 0
- `animate-slide-in-right` — drawer
- `animate-shimmer` — skeleton
- `animate-count-up` — angka berubah

### Page transition
Pakai Framer Motion `<AnimatePresence>` di layout level (opsional, hindari over-animation).

### Hover states
- Card: shadow naik (`shadow-soft → shadow-soft-md`) + scale 1.01.
- Table row: subtle bg shift.
- Button: brightness up 5%.

### Reduce motion
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PDF Templates

3 template (Modern, Classic, Minimal) di `src/lib/pdf/`. Mengikuti design system tapi adjusted untuk paper:

### Modern
- Header dengan colored band (primary).
- Logo kiri, "INVOICE" + nomor besar di kanan.
- Sans-serif typography.
- Subtle dividers.

### Classic
- Centered logo & company info.
- Serif typography (font built-in: Times).
- Heavy table borders.
- Traditional layout (mirip invoice tradisional Indonesia).

### Minimal
- Lots of whitespace.
- Mono font untuk numbers.
- No colored elements (grayscale).
- Cocok untuk B2B formal.

Detail layout di `docs/COMPONENTS.md` (di sub-section InvoicePreview) dan `lib/pdf/*-template.tsx`.

---

## Design Tokens Cheatsheet (Tailwind classes)

| Use case | Class |
|----------|-------|
| Body bg | `bg-background` |
| Body text | `text-foreground` |
| Card | `bg-card text-card-foreground border rounded-lg shadow-soft-sm` |
| Primary button | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Secondary button | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Input | `border border-input bg-background rounded-md px-3 h-10 focus:ring-2 focus:ring-ring` |
| Muted text | `text-muted-foreground` |
| Status badge | `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-status-paid/10 text-status-paid` |
| Tabular num | `tabular-nums font-mono` |
| Page heading | `text-3xl font-bold tracking-tight` |

---

## Catatan untuk Dev / Designer

- **Jangan ubah token utama** tanpa diskusi — efek riak ke seluruh app.
- **Sebelum buat custom component**, cek dulu apakah shadcn punya basis yang bisa di-extend.
- **Selalu test di mobile** — viewport 375×812 (iPhone SE) sebagai patokan terkecil.
- **Selalu test dark mode** — banyak bug muncul karena varian dark.
- **Print preview** untuk halaman yang akan di-print/PDF.
- **Lighthouse + axe** sebelum commit komponen baru.
