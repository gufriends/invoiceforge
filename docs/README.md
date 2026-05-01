# InvoiceForge — SaaS Invoice & Client Management

> **Platform invoice & client management untuk freelancer & UMKM Indonesia.**
> Bikin invoice profesional, track pembayaran, kelola klien, dan analisis pendapatan — semua dalam satu aplikasi yang cepat, modern, dan ramah lokal.

---

## Daftar Isi
1. [Visi & Misi](#visi--misi)
2. [Target User](#target-user)
3. [Core Features (MVP)](#core-features-mvp)
4. [Roadmap Fitur Lanjutan](#roadmap-fitur-lanjutan)
5. [Tech Stack](#tech-stack)
6. [Design Principles](#design-principles)
7. [Struktur Proyek](#struktur-proyek)
8. [Quick Start](#quick-start)
9. [Dokumentasi](#dokumentasi)
10. [Conventions](#conventions)

---

## Visi & Misi

**Visi:** Menjadi platform invoice favorit bagi 1 juta UMKM & freelancer di Indonesia pada 2030.

**Misi:**
- Memudahkan pengelolaan tagihan & cash-flow tanpa belajar akuntansi.
- Mendukung kepatuhan pajak Indonesia (PPN 11%, NPWP, e-Faktur ready) tanpa beban tambahan.
- Antarmuka yang **lebih cepat & lebih indah** dari kompetitor (Mekari Jurnal, Wave, FreshBooks).
- Harga yang terjangkau untuk freelancer pemula (free tier 5 invoice/bulan).

### Mengapa kami beda
| Aspek | Kompetitor umum | InvoiceForge |
|-------|-----------------|--------------|
| UX | Banyak field, kompleks | Form pintar, default cerdas, < 60 detik buat invoice |
| Lokal | Sebatas IDR | NPWP, PPN 11%, multi bank Indonesia, Bahasa Indonesia native |
| Tech | Legacy stack lambat | Next.js 15 + React 19 (RSC streaming) |
| Mobile | Responsif seadanya | Mobile-first, PWA-ready |
| Multi-currency | Jarang | IDR, USD, SGD, MYR, EUR (FX otomatis) |
| Open API | Premium-only | Tersedia di paket dasar |

---

## Target User

### Persona 1: **Andi Freelancer** (umur 26)
- Web developer freelance di Jakarta.
- Klien 5–10 per bulan, project-based.
- Butuh: kirim invoice cepat, track yang belum bayar, laporan pajak akhir tahun.
- Pain point: pakai Word/Excel manual, lupa follow-up.

### Persona 2: **Sari UMKM** (umur 38)
- Pemilik bakery online dengan 50+ pelanggan.
- Punya NPWP, PKP, perlu cetak Faktur Pajak.
- Butuh: invoice berulang (bulanan), reminder otomatis, integrasi bank.
- Pain point: software akuntansi terlalu rumit + mahal.

### Persona 3: **Rendy Agency** (umur 32)
- Owner creative agency (5 staff).
- Klien korporat, multi-currency (IDR + USD).
- Butuh: tim kolaborasi, multi-template, laporan pendapatan per project.
- Pain point: butuh look-feel premium yang merepresentasikan brand.

---

## Core Features (MVP)

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | **Auth** | Email/password, Google OAuth, password reset, brute-force protection |
| 2 | **Dashboard** | KPI cards, revenue chart, recent invoices, upcoming due |
| 3 | **Client Management** | CRUD client, tags, NPWP, statistik per-client |
| 4 | **Invoice Management** | Create, edit, send, duplicate, cancel; 3 template; multi-currency |
| 5 | **Payment Tracking** | Manual record (transfer, cash, e-wallet, QRIS); partial payment; auto status |
| 6 | **PDF Export** | Generate via `@react-pdf/renderer` — Modern, Classic, Minimal |
| 7 | **Email Integration** | Send via Resend; reminder otomatis (T+1, T+7, T+14) |
| 8 | **Analytics & Reports** | Revenue chart, status distribution, AR aging, tax report (PPN), CSV/PDF export |
| 9 | **Recurring Invoice** | Weekly, biweekly, monthly, quarterly, yearly |
| 10 | **Public Invoice Link** | Share via URL token (publicToken) — klien tidak perlu akun |
| 11 | **Multi-Currency** | IDR (default), USD, SGD, MYR, EUR; exchange rate snapshot |
| 12 | **Settings** | Profile, company, logo, NPWP, bank, default invoice settings |
| 13 | **Notifications** | In-app bell + email (invoice viewed, paid, overdue) |
| 14 | **Dark Mode** | Light/Dark/System; konsisten across charts & PDF preview |

---

## Roadmap Fitur Lanjutan

| Phase | Fitur | Prioritas |
|-------|-------|-----------|
| Q3 2026 | Faktur Pajak e-Faktur compliance | High |
| Q3 2026 | Integrasi gateway pembayaran (Midtrans, Xendit) | High |
| Q4 2026 | Quotation / Proposal → konversi ke Invoice | Medium |
| Q4 2026 | Time tracking → invoice dari log waktu | Medium |
| Q1 2027 | Mobile app (Expo / React Native) | Medium |
| Q1 2027 | Tim & multi-user per company | High |
| Q2 2027 | Open Banking (BNI, BCA API) untuk auto-reconcile | Medium |
| Q2 2027 | Webhook outbound + Zapier integration | Low |

---

## Tech Stack

### Framework & Runtime
| Layer | Pilihan | Versi | Alasan |
|-------|---------|-------|--------|
| Framework | **Next.js** | 15 (App Router) | RSC streaming, edge-ready, mature ekosistem |
| Runtime | **Node.js** | 20 LTS | Stable, broad compat |
| Bahasa | **TypeScript** | 5.6 | Type-safe end-to-end |
| Package mgr | **pnpm** | 9.x | Fast, disk-efficient, monorepo-ready |

### Routing & Data
| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Routing client | **TanStack Router** + Next.js App Router | TanStack untuk type-safe nested route inside dashboard |
| Data fetching | **TanStack Query v5** | Caching, optimistic update, dehydration |
| State client | **Zustand** | Light, TS-friendly, no boilerplate |
| Forms | **React Hook Form** + **Zod** | Performant, typed, schema-first |

### UI
| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Komponen | **shadcn/ui** (custom theme) | Owned code, headless Radix |
| Styling | **Tailwind CSS** 3.x → 4 | Utility-first, dark-mode native |
| Icon | **Lucide React** | Comprehensive, tree-shakable |
| Chart | **Recharts** | React-native, theme-able |
| Animation | **Framer Motion** | Production-grade, gestures |
| Toast | **Sonner** | Modern, themeable |
| Date | **date-fns** + **react-day-picker** | i18n Indonesia, lightweight |

### Backend
| Layer | Pilihan | Alasan |
|-------|---------|--------|
| API | **Next.js Route Handlers** | Co-located, RSC compatible |
| ORM | **Prisma 5** | Type-safe, migration tooling |
| Database | **SQLite** (dev) → **PostgreSQL 16** (prod) | Familiar; PG punya ecosystem mature |
| Auth | **NextAuth.js v5** (Auth.js) | Industry-standard, OAuth ready |
| Validation | **Zod** | Single source of truth between FE/BE |
| Email | **Resend** | Modern API, react-email template |
| File storage | **S3-compatible** (R2 / MinIO / S3) | Vendor-agnostic |
| Rate limit | **Upstash Redis** | Edge-friendly, free tier |
| Logging | **Pino** | Fast, structured JSON |
| Money math | **Decimal.js** | Avoid float precision bug |

### PDF
| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Generator | **@react-pdf/renderer** | JSX, component-based, server-side |

### Observability
| Layer | Pilihan |
|-------|---------|
| Errors | **Sentry** |
| Analytics | **PostHog** |
| Uptime | **UptimeRobot** / **Better Uptime** |

### Testing
| Layer | Pilihan |
|-------|---------|
| Unit/Integration | **Vitest** + **@testing-library/react** |
| Mock network | **MSW** |
| E2E | **Playwright** |
| A11y | **axe-core** |

### DevOps
| Layer | Pilihan |
|-------|---------|
| CI | **GitHub Actions** |
| Hosting | **Vercel** (default) / **Self-host Docker** |
| DB host | **Neon** / **Supabase** |
| CDN | **Cloudflare** |

---

## Design Principles

### 1. **Lokal dulu, kemudian global**
Indonesia adalah pasar utama. NPWP, PPN 11%, format tanggal/uang Indonesia, bank lokal, Bahasa Indonesia native. Multi-currency adalah secondary.

### 2. **Cepat di mana saja**
- LCP target < 1.5s di 4G mobile.
- First-load JS < 350 KB gz.
- RSC + streaming untuk render progresif.
- Optimistic update untuk semua mutation user-facing.

### 3. **Simple by default, powerful on demand**
- Default value cerdas (due date +30 hari, tax dari company default).
- Advanced options di section terpisah (tidak crowding).
- Auto-save draft untuk avoid lost work.

### 4. **Mobile-first, desktop-pleasure**
- Mobile: drawer, bottom sheet, full-screen form.
- Desktop: side-by-side preview, keyboard shortcut, command palette.

### 5. **Aksesibel**
- WCAG 2.1 AA minimum.
- Keyboard nav penuh.
- Screen reader support.
- Color contrast ≥ 4.5:1.

### 6. **Trust & transparency**
- Activity timeline lengkap di tiap invoice.
- Audit log keamanan.
- Status page publik.
- Privacy policy jelas (UU PDP compliant).

### 7. **Production-ready, bukan prototype**
- Setiap fitur punya test (unit + integration).
- Setiap mutasi punya optimistic + error path.
- Setiap input divalidasi.
- Setiap secret dikelola benar.

---

## Struktur Proyek

```
invoiceforge/
├── docs/                       # Dokumentasi arsitektur (lihat tabel di bawah)
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Seed data dev
├── public/
│   ├── images/                 # Static images (logo, illustrations)
│   └── fonts/                  # Custom web fonts
├── scripts/                    # Operational scripts (backup, smoke test, dll)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Public auth pages
│   │   ├── (app)/              # Authenticated app pages
│   │   ├── (public)/           # Public invoice view
│   │   └── api/                # API route handlers
│   ├── components/
│   │   ├── ui/                 # shadcn base components
│   │   ├── custom/             # Domain components (DataTable, ItemEditor, dst)
│   │   ├── layouts/            # AppLayout, AuthLayout
│   │   ├── forms/              # Composed form components
│   │   ├── charts/             # Chart wrappers
│   │   └── tables/             # Table-specific components
│   ├── hooks/                  # Custom hooks (TanStack Query + utility)
│   ├── lib/                    # Library code (auth, prisma, validations, pdf)
│   ├── services/               # Business logic (invoice.service, payment.service, ...)
│   ├── store/                  # Zustand stores
│   ├── types/                  # TypeScript shared types
│   ├── utils/                  # Pure utility functions
│   └── styles/                 # Global CSS, theme variables
├── test/
│   ├── e2e/                    # Playwright tests
│   ├── factories/              # Test data factories
│   ├── mocks/                  # MSW handlers
│   └── setup.ts                # Vitest setup
├── .env.example
├── next.config.ts
├── package.json
├── prisma/schema.prisma
├── tailwind.config.ts
└── tsconfig.json
```

Lihat `docs/IMPLEMENTATION.md` untuk struktur file detail per modul.

---

## Quick Start

### Prasyarat
- Node.js ≥ 20.10
- pnpm ≥ 9.0
- Docker (opsional, untuk Postgres lokal)

### 1. Install
```bash
git clone <repo-url>
cd invoiceforge
pnpm install
```

### 2. Setup environment
```bash
cp .env.example .env.local
# Isi minimum:
#   DATABASE_URL=file:./prisma/dev.db
#   AUTH_SECRET=$(openssl rand -base64 32)
#   AUTH_URL=http://localhost:3000
```

### 3. Setup database
```bash
pnpm db:setup     # generate + migrate + seed
```

### 4. Run
```bash
pnpm dev
# Buka http://localhost:3000
# Login demo: demo@invoiceforge.id / Demo1234!
```

### 5. Common commands
| Command | Tujuan |
|---------|--------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright |
| `pnpm prisma:studio` | DB GUI |

Lebih lengkap → `docs/DEPLOYMENT.md`.

---

## Dokumentasi

| Dokumen | Tujuan |
|---------|--------|
| `docs/README.md` | Project overview (file ini) |
| `docs/ARCHITECTURE.md` | System architecture, data flow, design decisions |
| `docs/DATABASE.md` | Prisma schema penjelasan, indexing, migration plan |
| `docs/API.md` | API contract (request/response untuk semua endpoint) |
| `docs/UI-DESIGN.md` | UI/UX specs, design system, layouts |
| `docs/COMPONENTS.md` | Komponen library: props, state, A11y |
| `docs/HOOKS.md` | Custom hooks: TanStack Query + utility |
| `docs/SECURITY.md` | Threat model, auth, validation, encryption |
| `docs/TESTING.md` | Test pyramid, test cases, factories |
| `docs/DEPLOYMENT.md` | Docker, CI/CD, monitoring, backup |
| `docs/IMPLEMENTATION.md` | Implementation plan & batch order untuk DeepSeek Coder |

---

## Conventions

### Code style
- **Prettier** untuk formatting (config: 2 spaces, single quotes, no semicolons di JSX, 100 col width).
- **ESLint** dengan `eslint-config-next` + rules tambahan.
- **Import order:** node modules → `@/lib` → `@/components` → `@/hooks` → relative.

### Commit style — Conventional Commits
```
feat(invoices): add recurring invoice support
fix(auth): handle empty session correctly
chore(deps): bump prisma to 5.22
docs(api): add example for /payments
test(invoice.service): cover refund path
refactor(hooks): extract useInvoiceTotals
```

### Branch naming
- `main` — production
- `staging` — staging
- `dev` — integration
- `feat/<name>`
- `fix/<name>`
- `chore/<name>`

### PR standards
- Judul: Conventional Commit format.
- Description: tujuan + screenshot UI + test plan.
- Required: 1 reviewer + CI pass.

### Bahasa
- **Code, identifier, comment kode:** English.
- **Dokumentasi `/docs/*`, error message ke user, UI string:** Bahasa Indonesia.
- **Commit message:** English.

---

## Lisensi
Proprietary © 2026 InvoiceForge. All rights reserved.

---

## Kontak
- Developer: dev@invoiceforge.id
- Support: support@invoiceforge.id
- Status: https://status.invoiceforge.id
