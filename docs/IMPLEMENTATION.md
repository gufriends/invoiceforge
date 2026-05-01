# InvoiceForge — Implementation Plan

Dokumen ini adalah **rencana eksekusi** pembangunan InvoiceForge oleh AI developer (DeepSeek Coder V2) atau tim manusia. Berisi urutan kerja dalam **batch** yang bisa dilakukan paralel atau seri, dengan kriteria penerimaan per batch.

> Pasangkan dokumen ini dengan: `README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `COMPONENTS.md`, `HOOKS.md`, `SECURITY.md`, `UI-DESIGN.md`, `TESTING.md`, `DEPLOYMENT.md`.

---

## Daftar Isi
1. [Filosofi Implementasi](#filosofi-implementasi)
2. [Phase Overview](#phase-overview)
3. [Batch Detail (untuk DeepSeek Coder)](#batch-detail-untuk-deepseek-coder)
4. [File Structure (Final)](#file-structure-final)
5. [Definition of Done](#definition-of-done)
6. [Risk Register](#risk-register)
7. [Tracking & Reporting](#tracking--reporting)

---

## Filosofi Implementasi

1. **Schema-first.** Selesaikan Prisma schema dulu sebelum service. Semua tipe diturunkan dari schema.
2. **Service-before-UI.** Service bisa di-test tanpa UI; bangun service + integration test sebelum komponen.
3. **Vertical slices.** Setelah foundation, kerjakan **per fitur end-to-end** (DB → Service → API → Hook → UI) supaya cepat ada demo.
4. **Type-safe everywhere.** Gunakan Zod sebagai source of truth untuk request/response. Generate type dengan `z.infer`.
5. **Tests as scaffolding.** Setiap batch wajib unit + integration test. E2E ditambah di akhir batch fitur.
6. **Working software early.** Setelah Phase 2, app sudah bisa create+send invoice end-to-end (walau belum cantik).

---

## Phase Overview

| Phase | Durasi est. | Output | Demo-able? |
|-------|-------------|--------|------------|
| **Phase 1: Foundation** | 4–5 hari | Project initialized, DB ready, auth bekerja, layout dasar | Bisa login, lihat dashboard kosong |
| **Phase 2: Core MVP** | 8–10 hari | CRUD client + invoice + payment, PDF + email | Bisa buat & kirim invoice nyata |
| **Phase 3: Analytics & Polish** | 5–6 hari | Dashboard charts, reports, recurring | Demo lengkap untuk investor |
| **Phase 4: Production Ready** | 4–5 hari | Testing, monitoring, deployment | Live di staging |
| **Phase 5: Launch** | 2 hari | Marketing site, billing, onboarding | Production launch |

---

## Batch Detail (untuk DeepSeek Coder)

Setiap **batch** adalah unit kerja yang bisa diselesaikan oleh DeepSeek Coder dalam 1 sesi (~2–4 jam). Output tiap batch harus lulus DoD (Definition of Done) di akhir dokumen.

### 🎯 Phase 1 — Foundation

#### Batch 1.1: Project bootstrap
**Tujuan:** Project Next.js dengan stack baseline.

**Tasks:**
- [ ] Verifikasi `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` (sudah disiapkan).
- [ ] `pnpm install`.
- [ ] Init git, `.gitignore` (Node, Next, Prisma, .env*).
- [ ] Buat `src/app/layout.tsx` root, `src/app/globals.css`, `src/styles/theme.css` (tokens).
- [ ] Setup providers: `<ThemeProvider>` (next-themes), `<QueryClientProvider>`, `<Toaster />` (sonner).
- [ ] Buat `src/lib/env.ts` (Zod validate env saat startup).
- [ ] Buat `src/lib/logger.ts` (Pino).
- [ ] Buat `src/lib/errors.ts` (`ApiError` class + helpers).
- [ ] Buat `src/lib/utils.ts` (`cn`, format helpers shadcn-style).
- [ ] `pnpm dev` jalan tanpa error.

**Acceptance:**
- Buka `http://localhost:3000` → tampil "InvoiceForge" placeholder.
- `pnpm typecheck`, `pnpm lint` zero error.

---

#### Batch 1.2: Database & Prisma
**Tujuan:** Schema migrasi siap, seed jalan.

**Tasks:**
- [ ] Verifikasi `prisma/schema.prisma`.
- [ ] `pnpm prisma generate`.
- [ ] `pnpm prisma migrate dev --name init`.
- [ ] Buat `prisma/seed.ts` (lihat `docs/DATABASE.md` untuk struktur).
- [ ] Buat `src/lib/prisma.ts` singleton + soft-delete extension.
- [ ] `pnpm prisma db seed` sukses.
- [ ] `pnpm prisma studio` bisa lihat data demo.

**Acceptance:**
- Demo user `demo@invoiceforge.id` ada.
- 50 invoice + 10 client + 30 payment ter-seed.

---

#### Batch 1.3: Auth (NextAuth v5)
**Tujuan:** Login/Register/Logout berfungsi.

**Tasks:**
- [ ] `src/lib/auth.ts` — NextAuth config dengan Credentials provider.
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — handler.
- [ ] `src/app/api/auth/register/route.ts` — endpoint custom register.
- [ ] `src/app/api/auth/forgot-password/route.ts` & `reset-password/route.ts`.
- [ ] `src/lib/auth/require.ts` — `requireUser`, `requireRole`, `requireOwnership`.
- [ ] `src/lib/auth/password.ts` — hash, compare, strength checker.
- [ ] `src/middleware.ts` — protect `/dashboard/*` redirect ke `/login` jika tidak login; rate-limit `/api/auth/*`.
- [ ] Login form (`src/components/forms/login-form.tsx`).
- [ ] Register form (`src/components/forms/register-form.tsx`).
- [ ] Forgot password form.
- [ ] Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`.

**Acceptance:**
- User baru bisa register → otomatis login → redirect `/dashboard`.
- Login wrong password → toast error.
- Brute-force 5x → akun lock 15 menit.
- Logout → cookie hilang.
- Integration test untuk `/api/auth/register` + `/api/auth/login` pass.

---

#### Batch 1.4: App layout & navigation
**Tujuan:** Layout dengan sidebar + topbar siap.

**Tasks:**
- [ ] `src/components/layouts/app-layout.tsx`.
- [ ] `src/components/layouts/sidebar.tsx` (responsive: drawer mobile, static desktop).
- [ ] `src/components/layouts/topbar.tsx` (search placeholder, theme toggle, user menu).
- [ ] `src/components/custom/notification-bell.tsx` (placeholder).
- [ ] `src/store/sidebar-store.ts` (Zustand persisted).
- [ ] `src/components/layouts/auth-layout.tsx`.
- [ ] `src/app/(app)/layout.tsx` — wrap with AppLayout + auth check.
- [ ] `src/app/(auth)/layout.tsx` — wrap with AuthLayout.
- [ ] Theme toggle (light/dark/system) berfungsi.
- [ ] Sidebar collapse berfungsi.
- [ ] `/dashboard` placeholder page.

**Acceptance:**
- Login → masuk dashboard layout.
- Mobile (375px): sidebar jadi drawer.
- Dark mode toggle persist.
- Tab navigation seluruh layout reachable.

---

#### Batch 1.5: Custom UI components dasar
**Tujuan:** Komponen reusable foundational.

**Tasks (urut prioritas):**
- [ ] Install shadcn base components (button, input, label, dialog, dropdown-menu, popover, select, table, badge, card, tabs, toast, skeleton, scroll-area, separator, switch, checkbox, calendar, sheet, alert-dialog, form, tooltip, avatar).
- [ ] `src/components/custom/data-table.tsx` (TanStack Table wrapper).
- [ ] `src/components/custom/stats-card.tsx`.
- [ ] `src/components/custom/empty-state.tsx`.
- [ ] `src/components/custom/loading-skeleton.tsx` (variants).
- [ ] `src/components/custom/currency-input.tsx`.
- [ ] `src/components/custom/date-range-picker.tsx`.
- [ ] `src/components/custom/search-input.tsx`.
- [ ] `src/components/custom/invoice-status-badge.tsx`.
- [ ] `src/components/custom/confirm-dialog.tsx`.
- [ ] Storybook page (atau test file) untuk visual verification.

**Acceptance:**
- Setiap komponen punya unit test minimal.
- Semua axe-clean.
- Locale id-ID berfungsi (CurrencyInput, DateRangePicker).

---

### 🎯 Phase 2 — Core MVP

#### Batch 2.1: Company Settings
**Tujuan:** User bisa update info perusahaan.

**Tasks:**
- [ ] `src/services/company.service.ts`.
- [ ] `src/lib/validations/company.ts` (Zod).
- [ ] `src/app/api/company/route.ts` (GET, PUT).
- [ ] `src/app/api/company/logo/route.ts` (POST, DELETE).
- [ ] `src/lib/storage/upload.ts` (S3 + sharp).
- [ ] `src/hooks/use-company.ts` + `useUpdateCompany`, `useUploadCompanyLogo`.
- [ ] `src/components/forms/company-form.tsx`.
- [ ] `src/app/(app)/settings/page.tsx` (tabs: Profile, Company, Invoice).
- [ ] Sub-page `/settings/company`.
- [ ] Integration test: GET, PUT.

**Acceptance:**
- User update company → reflect di header / invoice preview.
- Upload logo → tampil di topbar.
- Validasi NPWP format.

---

#### Batch 2.2: Client Management
**Tujuan:** CRUD client berfungsi.

**Tasks:**
- [ ] `src/lib/validations/client.ts`.
- [ ] `src/services/client.service.ts` (list, get, create, update, delete, getStats).
- [ ] API routes: `/api/clients`, `/api/clients/[id]`, `/api/clients/[id]/stats`, `/api/clients/[id]/invoices`.
- [ ] Hooks: `useClients`, `useClient`, `useClientStats`, `useCreateClient`, `useUpdateClient`, `useDeleteClient`.
- [ ] `src/components/custom/client-select.tsx`.
- [ ] `src/components/forms/client-form.tsx`.
- [ ] `src/components/tables/clients-table.tsx`.
- [ ] Pages:
  - [ ] `/clients` (list)
  - [ ] `/clients/create`
  - [ ] `/clients/[id]` (detail)
  - [ ] `/clients/[id]/edit`
- [ ] Integration test untuk semua endpoint.

**Acceptance:**
- Buat client baru → muncul di list.
- Filter aktif/non-aktif berfungsi.
- Hapus client tanpa invoice → success; dengan invoice → error dialog.
- Stats per-client benar.

---

#### Batch 2.3: Invoice Core (CRUD)
**Tujuan:** Buat, edit, lihat, hapus invoice.

**Tasks:**
- [ ] `src/lib/utils/calculate-totals.ts` (Decimal.js).
- [ ] `src/lib/utils/generate-invoice-number.ts`.
- [ ] `src/lib/validations/invoice.ts`.
- [ ] `src/services/invoice.service.ts` (create, update, delete, getById, list, listStats, getNextNumber, cancel, duplicate).
- [ ] API routes: list endpoints di `docs/API.md`.
- [ ] Hooks: `useInvoices`, `useInvoice`, `useInvoiceStats`, `useNextInvoiceNumber`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`, `useCancelInvoice`, `useDuplicateInvoice`.
- [ ] `src/hooks/use-invoice-totals.ts`.
- [ ] `src/components/custom/item-editor.tsx`.
- [ ] `src/components/custom/invoice-preview.tsx` (3 templates).
- [ ] `src/components/custom/invoice-template-card.tsx`.
- [ ] `src/components/forms/invoice-form.tsx` (multi-section + side preview).
- [ ] Pages:
  - [ ] `/invoices` (list dengan filter status + search)
  - [ ] `/invoices/create`
  - [ ] `/invoices/[id]` (detail)
  - [ ] `/invoices/[id]/edit`

**Acceptance:**
- Buat invoice → totals dihitung benar dengan PPN 11%.
- Edit invoice DRAFT → simpan, total update.
- Edit invoice PAID → field disabled.
- Auto-generate invoice number sequential per tahun.
- Concurrent test: 10 user buat invoice bersamaan, semua dapat nomor unik.

---

#### Batch 2.4: Payment Tracking
**Tujuan:** Catat pembayaran, status invoice transition.

**Tasks:**
- [ ] `src/lib/validations/payment.ts`.
- [ ] `src/services/payment.service.ts` (create, update, delete, list — dengan recompute invoice).
- [ ] State machine `INVOICE_TRANSITIONS` di `src/lib/invoice-state.ts`.
- [ ] API routes: `/api/payments`, `/api/payments/[id]`.
- [ ] Hooks: `usePayments`, `useCreatePayment`, `useUpdatePayment`, `useDeletePayment`.
- [ ] `src/components/custom/payment-dialog.tsx`.
- [ ] `src/components/custom/activity-timeline.tsx`.
- [ ] Section "Pembayaran" di `/invoices/[id]`.

**Acceptance:**
- Catat pembayaran sebagian → status PARTIAL, balanceDue update.
- Catat pembayaran sisanya → status PAID, paidAt set.
- Hapus pembayaran → status balik ke SENT/OVERDUE sesuai dueDate.
- Activity timeline tampilkan event chronological.

---

#### Batch 2.5: PDF Generation
**Tujuan:** Generate & download PDF invoice.

**Tasks:**
- [ ] `src/lib/pdf/styles.ts` (shared theme tokens for PDF).
- [ ] `src/lib/pdf/modern-template.tsx`.
- [ ] `src/lib/pdf/classic-template.tsx`.
- [ ] `src/lib/pdf/minimal-template.tsx`.
- [ ] `src/services/pdf.service.ts` (generatePdf, cachePdf di S3).
- [ ] `src/app/api/invoices/[id]/pdf/route.ts` (stream PDF).
- [ ] Tombol "Unduh PDF" di detail page.
- [ ] Tombol "Pratinjau" yang tampilkan PDF di iframe modal (opsional).

**Acceptance:**
- 3 template render benar dengan logo, items, totals.
- Bahasa Indonesia di label PDF.
- Currency formatted.
- File size < 200 KB untuk invoice biasa.

---

#### Batch 2.6: Email (Send Invoice)
**Tujuan:** Kirim invoice via email.

**Tasks:**
- [ ] `src/lib/email/resend-client.ts`.
- [ ] `src/lib/email/templates/` — template HTML (react-email):
  - [ ] `invoice-sent.tsx`
  - [ ] `payment-received.tsx`
  - [ ] `overdue-reminder.tsx`
  - [ ] `password-reset.tsx`
- [ ] `src/services/email.service.ts`.
- [ ] `src/app/api/invoices/[id]/send/route.ts`.
- [ ] `src/app/api/invoices/[id]/reminder/route.ts`.
- [ ] Hook `useSendInvoice`.
- [ ] Tombol "Kirim" di detail page + form invoice (saat status DRAFT).
- [ ] Modal konfirmasi: "Kirim ke {client.email}?".

**Acceptance:**
- Klik "Kirim" → email terkirim (dev: dry-run, log ke console).
- Status berubah DRAFT → SENT.
- PDF terlampir.
- Activity SENT log.
- Notifikasi in-app dibuat.

---

#### Batch 2.7: Public invoice link
**Tujuan:** Klien bisa view invoice tanpa login.

**Tasks:**
- [ ] `src/app/(public)/i/[token]/page.tsx` (Server Component).
- [ ] `src/app/api/public/invoices/[token]/route.ts`.
- [ ] `src/app/api/public/invoices/[token]/pdf/route.ts`.
- [ ] `src/services/public-invoice.service.ts` (handle viewedAt, activity, notification).
- [ ] Action "Bagikan link publik" → copy link.

**Acceptance:**
- Akses URL publik tanpa login → invoice tampil.
- Buka URL → status SENT → VIEWED, viewedAt update.
- Notifikasi muncul untuk pemilik.
- Token invalid → 404.

---

### 🎯 Phase 3 — Analytics & Polish

#### Batch 3.1: Dashboard
**Tujuan:** Halaman dashboard dengan stats + chart.

**Tasks:**
- [ ] `src/services/analytics.service.ts` (overview, revenueChart, clients, invoices).
- [ ] API `/api/analytics/overview`, `/api/analytics/revenue`, `/api/analytics/clients`, `/api/analytics/invoices`.
- [ ] Hooks: `useAnalyticsOverview`, `useRevenueChart`, dst.
- [ ] `src/components/charts/revenue-chart.tsx`.
- [ ] `src/components/charts/status-distribution.tsx`.
- [ ] `src/components/charts/top-clients-chart.tsx`.
- [ ] `src/components/charts/payment-method-chart.tsx`.
- [ ] `src/app/(app)/dashboard/page.tsx`:
  - [ ] 4 stats cards
  - [ ] Revenue chart
  - [ ] Recent invoices widget (top 10)
  - [ ] Upcoming due widget

**Acceptance:**
- Dashboard load < 2 detik.
- KPI calculate benar.
- Charts responsive + dark-mode.

---

#### Batch 3.2: Analytics Page
**Tujuan:** Halaman `/analytics` dengan chart lengkap.

**Tasks:**
- [ ] Range selector (DateRangePicker).
- [ ] Granularity selector (day/week/month).
- [ ] Currency filter (jika multi-currency aktif).
- [ ] Export chart → PNG (opsional).
- [ ] `src/app/(app)/analytics/page.tsx`.

**Acceptance:**
- Filter range → semua chart update.
- Comparison metric (vs previous period) tampil.

---

#### Batch 3.3: Reports
**Tujuan:** Halaman `/reports` dengan ekspor.

**Tasks:**
- [ ] `src/services/reports.service.ts` (income, tax, aging, clientStatement).
- [ ] API endpoints di `docs/API.md`.
- [ ] `src/lib/utils/export-csv.ts` (escapeCsvCell).
- [ ] PDF report templates di `lib/pdf/reports/`.
- [ ] Hooks `useIncomeReport`, dst.
- [ ] `src/app/(app)/reports/page.tsx` dengan tabs.

**Acceptance:**
- Income report CSV download benar (escape quote, comma).
- Tax report PDF render dengan table semua invoice taxable.
- Aging report bucket benar (current, 1-30, 31-60, 61-90, 90+).

---

#### Batch 3.4: Recurring Invoice
**Tujuan:** Auto-generate invoice berulang.

**Tasks:**
- [ ] `src/services/recurring.service.ts`.
- [ ] `src/app/api/cron/recurring-invoices/route.ts` (auth via CRON_SECRET).
- [ ] UI di invoice form: toggle "Recurring" + cycle selector + end date.
- [ ] Page `/invoices?isRecurring=true` (list template recurring).
- [ ] Distributed lock di Redis untuk prevent duplicate generation.
- [ ] Vercel cron config (atau OS cron equivalent).

**Acceptance:**
- Buat invoice recurring monthly → cron jalan → invoice baru muncul tiap bulan.
- Idempotent — jalankan 2x dalam 5 menit tidak duplikat.
- recurringEnd terlewati → tidak generate.

---

#### Batch 3.5: Notifications
**Tujuan:** In-app notification + email reminder.

**Tasks:**
- [ ] `src/services/notification.service.ts`.
- [ ] API `/api/notifications/*`.
- [ ] Hooks `useNotifications`, `useUnreadNotificationCount`, `useMarkNotificationsRead`.
- [ ] `src/components/custom/notification-bell.tsx` (full implementation, polling 60s).
- [ ] Cron `mark-overdue` & `send-reminders`.
- [ ] Setting page: toggle email notifications.

**Acceptance:**
- Klien view invoice → notification muncul untuk pemilik.
- Invoice OVERDUE → email reminder T+1 dikirim.
- Bell badge update tanpa refresh page.

---

#### Batch 3.6: Polish UX
**Tujuan:** Smooth UX di seluruh app.

**Tasks:**
- [ ] Animasi page transition (subtle).
- [ ] Keyboard shortcuts: `⌘+K` global search, `⌘+S` save form, `⌘+/` shortcut help.
- [ ] Command palette (cmdk) di topbar.
- [ ] Confirm dialog untuk semua destructive action.
- [ ] Auto-save invoice draft tiap 30 detik.
- [ ] Undo toast 5 detik untuk delete.
- [ ] Improvise empty states.
- [ ] Mobile sidebar drawer animation.
- [ ] Optimistic update untuk semua mutation.

**Acceptance:**
- Lighthouse mobile ≥ 90.
- A11y: axe zero violation di semua page.
- Cmd+K opens search.

---

### 🎯 Phase 4 — Production Ready

#### Batch 4.1: Testing
**Tujuan:** Test coverage ≥ 70%.

**Tasks:**
- [ ] Setup Vitest config + setup file + MSW.
- [ ] Setup Playwright config.
- [ ] Test factories di `test/factories/`.
- [ ] Unit tests untuk semua util di `lib/`.
- [ ] Service test (lihat list di `docs/TESTING.md`).
- [ ] API route tests (integration).
- [ ] Component tests untuk custom components.
- [ ] E2E: auth flow, invoice flow (golden path), client management, dashboard.
- [ ] CI workflow `.github/workflows/ci.yml`.

**Acceptance:**
- `pnpm check` (lint + typecheck + test) pass.
- Coverage ≥ 70%.
- E2E pass di CI.

---

#### Batch 4.2: Security hardening
**Tujuan:** Lulus security checklist.

**Tasks:**
- [ ] CSRF token implementation.
- [ ] Rate limit di middleware (per group).
- [ ] Audit log ke setiap action sensitive.
- [ ] Field encryption untuk NPWP, bank account.
- [ ] Security headers (sudah di `next.config.ts`, verify).
- [ ] Penetration test checklist (manual sweep).
- [ ] Secret scanner (gitleaks) di pre-commit.

**Acceptance:**
- OWASP ZAP baseline scan tanpa High finding.
- Manual IDOR test: tidak ada leak.

---

#### Batch 4.3: Monitoring & Observability
**Tujuan:** Production observability.

**Tasks:**
- [ ] Sentry setup (FE + BE).
- [ ] Pino logger pipe ke central log.
- [ ] `/api/health` endpoint.
- [ ] PostHog setup (optional).
- [ ] UptimeRobot config.
- [ ] Slack webhook alerting.

**Acceptance:**
- Trigger error → Sentry capture.
- Health check pass dari UptimeRobot.
- Alert ter-route ke Slack.

---

#### Batch 4.4: Deployment
**Tujuan:** Live di staging + production-ready.

**Tasks:**
- [ ] Dockerfile + docker-compose.
- [ ] GitHub Actions deploy workflow.
- [ ] Setup Neon Postgres staging.
- [ ] Setup Cloudflare R2 / S3 bucket prod.
- [ ] Setup Upstash Redis.
- [ ] Setup Resend domain (SPF, DKIM).
- [ ] Configure Vercel project + env vars.
- [ ] Smoke test script.
- [ ] Backup script + cron.
- [ ] DNS cutover (jika sudah punya domain).

**Acceptance:**
- Staging URL accessible.
- Migrate prod DB.
- Production deploy + smoke test pass.
- Backup berjalan harian.

---

### 🎯 Phase 5 — Launch

#### Batch 5.1: Onboarding
- Welcome modal first-time login.
- Sample data toggle (clear / load demo).
- Guided tour (Shepherd.js atau driver.js).

#### Batch 5.2: Marketing site
- Landing page (`/`)
- Pricing
- About
- Privacy & Terms

#### Batch 5.3: Billing (jika SaaS)
- Plan: Free, Pro, Business.
- Integrasi Stripe/Midtrans.
- Quota enforcement.

#### Batch 5.4: Help center
- Static MDX docs di `/help/*`.
- FAQ.

---

## File Structure (Final)

```
invoiceforge/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── UI-DESIGN.md
│   ├── COMPONENTS.md
│   ├── HOOKS.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   └── IMPLEMENTATION.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── empty-invoices.svg
│   │   ├── empty-clients.svg
│   │   ├── empty-data.svg
│   │   └── auth-bg.svg
│   └── fonts/
│       ├── Inter.var.woff2
│       └── JetBrainsMono.woff2
├── scripts/
│   ├── backup.sh
│   ├── smoke-test.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                       # /
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx                # redirect ke /settings/profile
│   │   │       ├── profile/page.tsx
│   │   │       ├── company/page.tsx
│   │   │       ├── invoice/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       └── security/page.tsx
│   │   ├── (public)/
│   │   │   └── i/[token]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── auth/forgot-password/route.ts
│   │       ├── auth/reset-password/route.ts
│   │       ├── auth/me/route.ts
│   │       ├── company/route.ts
│   │       ├── company/logo/route.ts
│   │       ├── clients/route.ts
│   │       ├── clients/[id]/route.ts
│   │       ├── clients/[id]/stats/route.ts
│   │       ├── clients/[id]/invoices/route.ts
│   │       ├── invoices/route.ts
│   │       ├── invoices/[id]/route.ts
│   │       ├── invoices/[id]/send/route.ts
│   │       ├── invoices/[id]/duplicate/route.ts
│   │       ├── invoices/[id]/cancel/route.ts
│   │       ├── invoices/[id]/pdf/route.ts
│   │       ├── invoices/[id]/reminder/route.ts
│   │       ├── invoices/stats/route.ts
│   │       ├── invoices/number/next/route.ts
│   │       ├── payments/route.ts
│   │       ├── payments/[id]/route.ts
│   │       ├── analytics/overview/route.ts
│   │       ├── analytics/revenue/route.ts
│   │       ├── analytics/clients/route.ts
│   │       ├── analytics/invoices/route.ts
│   │       ├── reports/income/route.ts
│   │       ├── reports/tax/route.ts
│   │       ├── reports/aging/route.ts
│   │       ├── reports/client-statement/[clientId]/route.ts
│   │       ├── notifications/route.ts
│   │       ├── notifications/[id]/route.ts
│   │       ├── notifications/mark-read/route.ts
│   │       ├── public/invoices/[token]/route.ts
│   │       ├── public/invoices/[token]/pdf/route.ts
│   │       ├── cron/mark-overdue/route.ts
│   │       ├── cron/send-reminders/route.ts
│   │       ├── cron/recurring-invoices/route.ts
│   │       ├── cron/cleanup-tokens/route.ts
│   │       ├── webhooks/resend/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── ui/                             # shadcn (button, input, dst)
│   │   ├── custom/
│   │   │   ├── data-table.tsx
│   │   │   ├── stats-card.tsx
│   │   │   ├── currency-input.tsx
│   │   │   ├── date-range-picker.tsx
│   │   │   ├── search-input.tsx
│   │   │   ├── invoice-status-badge.tsx
│   │   │   ├── invoice-preview.tsx
│   │   │   ├── invoice-template-card.tsx
│   │   │   ├── payment-dialog.tsx
│   │   │   ├── client-select.tsx
│   │   │   ├── item-editor.tsx
│   │   │   ├── activity-timeline.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── notification-bell.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── loading-skeleton.tsx
│   │   ├── layouts/
│   │   │   ├── app-layout.tsx
│   │   │   ├── auth-layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   ├── forms/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── reset-password-form.tsx
│   │   │   ├── invoice-form.tsx
│   │   │   ├── client-form.tsx
│   │   │   ├── company-form.tsx
│   │   │   ├── profile-form.tsx
│   │   │   └── payment-form.tsx
│   │   ├── charts/
│   │   │   ├── revenue-chart.tsx
│   │   │   ├── status-distribution.tsx
│   │   │   ├── top-clients-chart.tsx
│   │   │   └── payment-method-chart.tsx
│   │   └── tables/
│   │       ├── invoices-table.tsx
│   │       ├── clients-table.tsx
│   │       └── payments-table.tsx
│   ├── hooks/
│   │   ├── query-keys.ts
│   │   ├── use-invoices.ts
│   │   ├── use-clients.ts
│   │   ├── use-payments.ts
│   │   ├── use-company.ts
│   │   ├── use-analytics.ts
│   │   ├── use-notifications.ts
│   │   ├── use-me.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-toggle.ts
│   │   ├── use-copy-to-clipboard.ts
│   │   ├── use-keyboard-shortcut.ts
│   │   ├── use-currency-formatter.ts
│   │   ├── use-date-formatter.ts
│   │   ├── use-invoice-totals.ts
│   │   ├── use-confirm.tsx
│   │   ├── use-pagination.ts
│   │   ├── use-filters.ts
│   │   ├── use-prefetch.ts
│   │   ├── use-document-title.ts
│   │   ├── use-scroll-lock.ts
│   │   └── use-online-status.ts
│   ├── lib/
│   │   ├── env.ts
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── auth/
│   │   │   ├── require.ts
│   │   │   └── password.ts
│   │   ├── api-client.ts                   # fetch wrapper utk client side
│   │   ├── csrf.ts
│   │   ├── rate-limit.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── query-client.ts
│   │   ├── invoice-state.ts                # state machine
│   │   ├── crypto/
│   │   │   └── field-encryption.ts
│   │   ├── storage/
│   │   │   ├── upload.ts
│   │   │   └── s3-client.ts
│   │   ├── email/
│   │   │   ├── resend-client.ts
│   │   │   └── templates/
│   │   │       ├── invoice-sent.tsx
│   │   │       ├── payment-received.tsx
│   │   │       ├── overdue-reminder.tsx
│   │   │       └── password-reset.tsx
│   │   ├── pdf/
│   │   │   ├── styles.ts
│   │   │   ├── modern-template.tsx
│   │   │   ├── classic-template.tsx
│   │   │   ├── minimal-template.tsx
│   │   │   └── reports/
│   │   │       ├── income-report.tsx
│   │   │       ├── tax-report.tsx
│   │   │       └── client-statement.tsx
│   │   ├── utils.ts
│   │   ├── validations/
│   │   │   ├── auth.ts
│   │   │   ├── invoice.ts
│   │   │   ├── client.ts
│   │   │   ├── payment.ts
│   │   │   └── company.ts
│   │   └── constants.ts
│   ├── services/
│   │   ├── invoice.service.ts
│   │   ├── client.service.ts
│   │   ├── payment.service.ts
│   │   ├── company.service.ts
│   │   ├── analytics.service.ts
│   │   ├── reports.service.ts
│   │   ├── notification.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   ├── public-invoice.service.ts
│   │   ├── audit.service.ts
│   │   └── recurring.service.ts
│   ├── store/
│   │   ├── sidebar-store.ts
│   │   ├── theme-store.ts                  # opsional, kalau tidak full pakai next-themes
│   │   └── command-palette-store.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── invoice.ts
│   │   ├── client.ts
│   │   ├── payment.ts
│   │   ├── company.ts
│   │   ├── notification.ts
│   │   ├── analytics.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── format-currency.ts
│   │   ├── format-date.ts
│   │   ├── format-phone.ts
│   │   ├── parse-currency.ts
│   │   ├── generate-invoice-number.ts
│   │   ├── calculate-totals.ts
│   │   └── export-csv.ts
│   └── styles/
│       └── theme.css
├── test/
│   ├── setup.ts
│   ├── factories/
│   ├── mocks/
│   ├── helpers/
│   ├── fixtures/
│   └── e2e/
├── .env.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── playwright.config.ts
└── vitest.config.ts
```

---

## Definition of Done

Setiap batch dianggap **DONE** ketika:

- [ ] Code merged ke `dev` branch.
- [ ] `pnpm typecheck` zero error.
- [ ] `pnpm lint` zero warning.
- [ ] `pnpm test` pass dengan coverage ≥ batch target (≥ 70% untuk service).
- [ ] Integration test untuk endpoint baru hijau.
- [ ] Halaman / komponen yang baru dibuat sudah responsive (test viewport 375 / 768 / 1280).
- [ ] Dark mode terverifikasi.
- [ ] A11y: axe zero violation.
- [ ] Documentation update (jika ada API/component baru).
- [ ] PR description berisi: tujuan, screenshot, test plan, impact assessment.
- [ ] CI hijau.
- [ ] 1 reviewer approval (atau self-review checklist untuk solo dev).

---

## Risk Register

| # | Risiko | Likelihood | Impact | Mitigasi |
|---|--------|------------|--------|----------|
| 1 | Migration error saat switch SQLite → Postgres | Medium | High | Test migration di staging dulu, snapshot dump SQLite, dual-test schema |
| 2 | NextAuth v5 beta API berubah | High | Medium | Pin version, monitor changelog, abstract auth helpers |
| 3 | @react-pdf/renderer rendering mismatch | Medium | Medium | Snapshot test, real-paper preview |
| 4 | Money precision bug | Low | High | Decimal.js wajib di service, test edge cases (0.1+0.2) |
| 5 | Race di invoice number gen | Medium | Medium | Transaction + retry on unique constraint |
| 6 | Email deliverability rendah | Medium | Medium | SPF/DKIM/DMARC, monitor Resend webhook |
| 7 | Vercel function timeout untuk PDF generation | Low | Medium | Cache PDF di S3, regenerate on demand |
| 8 | Cost ekspansi cepat | Low | Medium | Set quota free tier, monitor at $50 / $100 / $250 thresholds |
| 9 | Decimal serialization (Prisma JSON) | Medium | Low | Convert ke Number di response transformer |
| 10 | Drag-drop reorder di mobile | Medium | Low | Pakai dnd-kit + touch sensor, test di iOS |

---

## Tracking & Reporting

### Format progress (untuk DeepSeek Coder)

Setiap selesai batch, hasilkan laporan markdown:

```md
## Batch X.Y — <name> — DONE

### Files added/modified
- `src/services/invoice.service.ts` (new)
- `src/lib/utils/calculate-totals.ts` (new)
- ...

### Tests
- Unit: 12 new (all pass)
- Integration: 5 new (all pass)
- E2E: tidak applicable

### Coverage delta
- Before: 65% / After: 72%

### Demo
- (URL preview / screenshot)

### Notes / blockers
- ...
```

### Daily standup (jika tim)
- Apa yang selesai kemarin
- Apa yang dikerjakan hari ini
- Blocker

### Weekly retrospective
- Apa yang berjalan baik
- Apa yang perlu diperbaiki
- Action items

---

## Post-Launch

Setelah Phase 5, fokus geser ke:

1. **Iteration based on feedback** — pakai PostHog session replay + user interview.
2. **Roadmap fitur** (lihat `README.md`).
3. **SOC 2 / ISO 27001 prep** — saat user enterprise.
4. **i18n English** — saat ekspansi regional.

---

## Resource untuk DeepSeek Coder

Saat membangun, **selalu rujuk dokumen ini**:

| Pertanyaan | Dokumen |
|------------|---------|
| Bagaimana struktur tabel X? | `DATABASE.md` |
| Apa request/response endpoint Y? | `API.md` |
| Komponen ini props-nya apa? | `COMPONENTS.md` |
| Hook ini cache strategy-nya bagaimana? | `HOOKS.md` |
| Bagaimana validasi input X? | `SECURITY.md` + `API.md` (Validation rules) |
| Test apa saja yang harus dibuat? | `TESTING.md` |
| Layout halaman X seperti apa? | `UI-DESIGN.md` |
| Bagaimana arsitektur layer? | `ARCHITECTURE.md` |
| Bagaimana setup deploy? | `DEPLOYMENT.md` |

**Prinsip:** Jika dokumen tidak menjawab → tanya / putuskan dengan reasoning yang dicatat di code comment + update dokumen yang relevan.
