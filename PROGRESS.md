# InvoiceForge — Progress & Work Log

> **Tujuan file ini:** Catatan progress yang dipush ke repo. Kalau session Claude kehabisan token, atau handover ke orang lain, baca file ini dulu untuk tahu posisi kerjaan.

**Last updated:** 2026-05-02 (ses overnight UX pass)
**Updated by:** Claude (Opus 4.7)
**Current branch:** `feat/overnight-ux-pass` (belum di-merge ke main)

---

## 📍 Posisi Saat Ini

- **Production:** Vercel masih live (URL Vercel jalan untuk uji coba)
- **Database:** Supabase (DATABASE_URL di `.env` / Vercel env vars)
- **Self-host plan:** Belum mulai eksekusi (lihat blocker #1 di bawah)
- **Branch aktif:** `feat/overnight-ux-pass` — UX overnight pass, 3 commits, sudah dipush
- **PR:** Belum dibuka. Open PR di: https://github.com/gufriends/invoiceforge/pull/new/feat/overnight-ux-pass

---

## 🚨 Blocker / Action Items Mendesak

### 1. GitHub Personal Access Token bocor (KRITIS)
- Token `ghp_EdUQ...` ada plain-text di `.git/config` (URL remote)
- **Action:**
  1. Revoke di https://github.com/settings/tokens
  2. Ganti remote ke SSH:
     ```bash
     git remote set-url origin git@github.com:gufriends/invoiceforge.git
     ```
  3. (Optional) Setup SSH key kalau belum: `ssh-keygen -t ed25519 -C "gufriends@..."`, terus daftarin public key di GitHub settings.

### 2. Self-host deploy belum jalan
- Plan: PM2 + Nginx + Cloudflare Tunnel di laptop Ghufran (Ubuntu 26.04, Node v22.22.2, pnpm 10.33.2)
- State laptop: Node ✅, pnpm ✅, cloudflared CLI ✅ (cert.pem.bak ada — perlu restore atau `cloudflared tunnel login` ulang). PM2 ❌, Nginx ❌ (perlu install).
- **Pending decision:** Domain — punya domain di Cloudflare, atau test pakai `*.trycloudflare.com` dulu?
- **Next step setelah unblock:** install PM2 + Nginx, pindah project ke `~/apps/invoiceforge`, setup `.env.production`, restore Cloudflare Tunnel.

---

## ✅ Yang Sudah Selesai

### Sesi 2026-05-01 — Playwright E2E suite
- Commit `72c9747`
- Setup Playwright config, global setup (login storage state), 9 smoke tests
- GitHub Action workflow (`.github/workflows/e2e.yml`) dengan Postgres service container
- Seed E2E user (`prisma/seed-e2e.ts`)
- **Pending follow-ups:**
  - [ ] Generate visual baseline screenshot (HARUS di Linux env biar match CI Ubuntu — saran: Docker `mcr.microsoft.com/playwright:v1.49.0-jammy`)
  - [ ] (Optional) Set GitHub Secret `CI_AUTH_SECRET` untuk NextAuth di CI

### Sesi 2026-05-01 → 2026-05-02 (overnight) — UX overhaul pass
Branch `feat/overnight-ux-pass`. 3 commits:

#### `a83e5ea` fix(ui): solid modal overlays + footer + mobile width
- Sheet/Dialog/AlertDialog overlay: `bg-black/75 + backdrop-blur-sm` (solid + blur)
- DialogFooter: `bg-muted/50` → `bg-muted` (solid, gak transparan)
- AlertDialog: `max-w-md` → `max-w-[calc(100%-2rem)] sm:max-w-md` (responsive di HP)
- **User-reported issue (modal transparan tulisan beradu) → RESOLVED**

#### `b0e7f02` fix(tables): wrap with overflow-x-auto for mobile
- Invoices & Clients table dapat horizontal scroll wrapper
- HP bisa swipe lihat kolom yang ke-truncate

#### `3d4bf5e` a11y: aria-labels on icon buttons + aria-invalid on auth forms
- aria-label di icon-only buttons: topbar (menu/theme/bell), item-editor delete, table action triggers
- aria-invalid + aria-describedby di semua auth form (login/register/forgot/reset)
- autoComplete hints (password manager friendly)

**Verifikasi:**
- ✅ `npx tsc --noEmit` pass
- ✅ `pnpm build` pass (47 routes compiled)
- 12 file changed, +137 / -27

---

## 🔜 Yang Belum Dikerjakan (sengaja deferred dari overnight pass)

Audit overnight ketemu ini, tapi sengaja gak gue fix biar scope tetap kecil & low-risk. Bisa ditangani next session:

### Type safety
- [ ] `src/app/(app)/reports/page.tsx:19, 26` — `any[]` types di `useIncomeReport`/`useTaxReport`. Perlu proper types dari Prisma return shapes.
- [ ] `src/app/api/invoices/[id]/pdf/route.tsx:20-22` — `as any` casts ke PDF templates. Perlu investigate `@react-pdf/renderer` template prop types.

### Fitur belum lengkap
- [ ] Settings → Notifikasi tab: UI toggles render tapi gak ada API persistence. Perlu schema addition (e.g., `User.notificationPrefs` JSON column atau table baru) + endpoint update + integration ke notification system (Resend email sudah terpasang).

### UX polish
- [ ] Status badges (`invoice-status-badge.tsx`) cuma rely on color — colorblind users gak bisa bedain. Perlu design decision: tambah icon? (e.g., check buat PAID, jam buat OVERDUE)
- [ ] Theme toggle di `topbar.tsx:25` ada hydration flicker (Moon icon kelihatan sebentar sebelum hydrate). Fix via CSS-driven detection — low priority.
- [ ] Reports page: gak ada loading skeleton & empty state. Kalau data kosong sekarang renders empty table.
- [ ] Popovers/Selects (date picker, client select) gak ada backdrop dim. Standard Radix tapi inkonsisten dengan modal full. Design call.

### Test coverage
- [ ] Visual regression baseline buat Playwright (lihat blocker #2 di bagian Playwright)

---

## 🗺️ Project Map (quick reference)

```
src/
├── app/
│   ├── (app)/          # Routes ber-auth: dashboard, invoices, clients, analytics, reports, settings
│   ├── (auth)/         # Login, register, forgot/reset password
│   └── api/            # API routes (REST-style, NextAuth, cron jobs)
├── components/
│   ├── ui/             # Radix-based primitives (Dialog, Button, dll)
│   ├── custom/         # Project-specific (InvoiceStatusBadge, EmptyState, ItemEditor)
│   ├── forms/          # Form components (Login, Register, Invoice, Payment, Client)
│   ├── tables/         # InvoicesTable, ClientsTable
│   ├── layouts/        # Sidebar, Topbar
│   ├── charts/         # Recharts wrappers
│   └── animations/     # Page transitions, motion wrappers
├── services/           # Business logic (invoice, client, payment, company)
├── hooks/              # React Query hooks
├── lib/                # Utils, validations, prisma client, pdf templates, api-utils
└── types/              # Shared TypeScript types

prisma/
├── schema.prisma       # 9 models: User, Company, Client, Invoice, InvoiceItem, Payment, Account, Session, VerificationToken
├── seed.ts             # Demo data
└── seed-e2e.ts         # E2E test user (idempotent upsert)

docs/                   # Spec & design docs (BUILD-GUIDE Phase 1-4, ARCHITECTURE, etc)
e2e/                    # Playwright tests
.github/workflows/      # CI: e2e.yml
```

---

## 🔧 Useful Commands

```bash
# Dev
pnpm dev                 # Start Next.js dev server (port 3000)
pnpm db:studio           # Prisma Studio (DB browser)

# Type & build
npx tsc --noEmit         # Type check (no emit)
pnpm build               # Production build

# Tests
pnpm test                # Vitest unit tests
pnpm test:e2e            # Playwright E2E
pnpm test:e2e:update     # Update visual snapshots (DI LINUX!)

# DB
pnpm db:migrate          # Migrations dev
pnpm db:seed             # Seed demo data
pnpm db:seed:e2e         # Seed E2E user

# Self-host (planned)
pm2 start ecosystem.config.cjs   # Belum dibuat
sudo systemctl reload nginx       # Belum di-setup
cloudflared tunnel run invoiceforge  # Belum direstore
```

---

## 📝 Catatan Resume buat Session Berikutnya

**Kalau Ghufran balik dan bilang "lanjut":**
1. Baca file ini dulu
2. Cek blocker #1 (token revoke) — kalau belum, REMIND DIA
3. Cek blocker #2 (self-host deploy) — tanya apakah masih mau eksekusi
4. Cek PR `feat/overnight-ux-pass` — belum di-merge?
5. Tanya prioritas: review PR, lanjut deploy, atau ambil dari deferred list?

**Kalau ada update besar dari kerjaan ini, update file ini juga ya** — biar terus jadi single source of truth posisi kerjaan.
