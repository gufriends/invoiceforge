# InvoiceForge — Architecture Design

Dokumen ini menjelaskan **arsitektur sistem** InvoiceForge: bagaimana komponen saling berhubungan, alur data, dan keputusan desain di balik tiap pilihan.

> Untuk **schema database lengkap** lihat `docs/DATABASE.md`. Untuk **API contract** lihat `docs/API.md`. Dokumen ini fokus pada **how things fit together**.

---

## Daftar Isi
1. [High-Level Architecture](#high-level-architecture)
2. [Render Strategy (RSC vs Client)](#render-strategy-rsc-vs-client)
3. [Lapisan Aplikasi (Layered Architecture)](#lapisan-aplikasi-layered-architecture)
4. [Data Flow End-to-End](#data-flow-end-to-end)
5. [State Management Strategy](#state-management-strategy)
6. [Caching Architecture](#caching-architecture)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Concurrency & Race Conditions](#concurrency--race-conditions)
9. [Background Jobs](#background-jobs)
10. [Folder Layout & Module Boundaries](#folder-layout--module-boundaries)
11. [Cross-Cutting Concerns](#cross-cutting-concerns)
12. [Architectural Decision Records](#architectural-decision-records)

---

## High-Level Architecture

```
                                ┌─────────────────────────┐
                                │     Cloudflare CDN      │
                                │  (DNS, WAF, edge cache) │
                                └────────────┬────────────┘
                                             │
                 ┌───────────────────────────┴─────────────────────────────┐
                 │                                                         │
        ┌────────▼────────┐                                       ┌────────▼────────┐
        │  Next.js Web    │                                       │  Public Invoice │
        │  (RSC + Client) │                                       │  /i/<token>     │
        └────────┬────────┘                                       └────────┬────────┘
                 │                                                         │
                 ▼                                                         ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                          Next.js Edge / Node Runtime                             │
   │                                                                                   │
   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
   │  │  Middleware  │ -> │ Route Handle │ -> │   Service    │ -> │   Prisma     │  │
   │  │  (auth, RL)  │    │   (zod val)  │    │   Layer      │    │   Client     │  │
   │  └──────────────┘    └──────────────┘    └──────┬───────┘    └──────┬───────┘  │
   │                                                  │                   │           │
   └──────────────────────────────────────────────────┼───────────────────┼──────────┘
                                                      │                   │
                          ┌───────────────────────────┼───────────────────┼─┐
                          │                           ▼                   ▼ │
                ┌─────────▼─────────┐         ┌──────────────┐   ┌──────────────┐
                │ Upstash Redis     │         │  PostgreSQL  │   │  Object      │
                │  (rate-limit,     │         │   (Neon)     │   │  Storage     │
                │  cache, locks)    │         │              │   │  (R2 / S3)   │
                └───────────────────┘         └──────────────┘   └──────────────┘

   ┌────────────────────────────────────────────────────────────────────────────────┐
   │                        External Services (one-way push)                         │
   │   ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
   │   │  Resend  │  │  Sentry    │  │ PostHog  │  │  Slack   │  │  S3 mig. │      │
   │   │  (email) │  │ (errors)   │  │(analytic)│  │ (alerts) │  │ (backup) │      │
   │   └──────────┘  └────────────┘  └──────────┘  └──────────┘  └──────────┘      │
   └────────────────────────────────────────────────────────────────────────────────┘
```

### Komponen utama
- **Next.js App Router** — single deployable yang menyajikan FE + API.
- **Middleware** — autentikasi, rate-limit, CSRF check, logging.
- **Route Handlers** (`/api/...`) — entry point HTTP, validasi Zod, lalu delegasi ke service.
- **Service Layer** — business logic, orchestrasi (DB, email, file, queue).
- **Prisma Client** — DB access (singleton).
- **External Services** — Resend (email), S3 (file), Upstash Redis (rate-limit + cache), Sentry, PostHog.

---

## Render Strategy (RSC vs Client)

Next.js 15 + React 19 memberi kita **3 mode rendering**. Pilihan per page:

| Page | Mode | Alasan |
|------|------|--------|
| `/login`, `/register` | **Server Component** + Client Form | Static layout + minimal interactive |
| `/dashboard` | **Server Component** (initial) + Client interactivity | Data prefetched server-side, hydrated ke TanStack Query |
| `/invoices` (list) | **Server Component** + DataTable client | List statis di SSR; sort/filter via client (URL params) |
| `/invoices/[id]` | **Server Component** prefetch + client form | Initial data via SSR, edit interactive |
| `/invoices/create` | **Client Component** | Form complex, real-time totals |
| `/analytics` | **Server Component** prefetch + client charts | Data berat di-fetch SSR |
| `/i/[token]` (public) | **Server Component** | Static, optimize for SEO/cache |

### Pola hybrid (rekomendasi)

```tsx
// app/(app)/invoices/page.tsx (Server Component)
export default async function InvoicesPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.invoices.list(searchParams),
    queryFn: () => invoiceService.listInvoices(session.user.id, searchParams),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvoicesPageClient />
    </HydrationBoundary>
  );
}
```

```tsx
// invoices-page-client.tsx (Client Component)
"use client";
export function InvoicesPageClient() {
  const params = useSearchParams();
  const filters = parseFilters(params);
  const { data, isLoading } = useInvoices(filters); // hydrated cache
  // ... DataTable, search, pagination
}
```

**Manfaat:**
- Initial paint cepat (SSR).
- Subsequent navigation cepat (TanStack Query cache).
- SEO-friendly untuk public pages.

---

## Lapisan Aplikasi (Layered Architecture)

```
┌─────────────────────────────────────────────────┐
│  UI Layer                                       │
│  - components/, app/(app)/*/page.tsx            │
│  - Tidak pernah call Prisma langsung            │
└────────────────────┬────────────────────────────┘
                     │ via hooks (useInvoices, ...)
                     ▼
┌─────────────────────────────────────────────────┐
│  Hooks Layer (TanStack Query wrapper)           │
│  - hooks/use-*.ts                               │
│  - Cache, optimistic update, query keys         │
└────────────────────┬────────────────────────────┘
                     │ HTTP fetch
                     ▼
┌─────────────────────────────────────────────────┐
│  API Layer (Route Handlers)                     │
│  - app/api/**/route.ts                          │
│  - Auth, validation, error mapping              │
└────────────────────┬────────────────────────────┘
                     │ direct call (server-side)
                     ▼
┌─────────────────────────────────────────────────┐
│  Service Layer (Business Logic)                 │
│  - services/*.service.ts                        │
│  - Orkestrasi: DB, Email, File, Queue           │
│  - Tidak depend pada HTTP context               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Data Access Layer                              │
│  - lib/prisma.ts (singleton)                    │
│  - lib/storage.ts (S3)                          │
│  - lib/email.ts (Resend)                        │
└─────────────────────────────────────────────────┘
```

### Aturan dependency
- **UI → Hooks → API → Service → Data**, tidak boleh sebaliknya.
- **Service tidak tahu HTTP** — bisa dipanggil dari API route, dari cron, atau dari script.
- **Hooks tidak tahu DB** — hanya tahu API endpoint.
- **Type sharing** lewat `src/types/*.ts` (shared interfaces).

### Contoh service

```ts
// src/services/invoice.service.ts
import { prisma } from "@/lib/prisma";
import { calculateTotals } from "@/lib/utils/calculate-totals";
import { generateInvoiceNumber } from "@/lib/utils/generate-invoice-number";
import { ApiError } from "@/lib/errors";

export const invoiceService = {
  async createInvoice(userId: string, input: CreateInvoiceInput): Promise<Invoice> {
    return prisma.$transaction(async (tx) => {
      // 1. Validasi ownership client
      const client = await tx.client.findFirst({
        where: { id: input.clientId, userId, deletedAt: null },
      });
      if (!client) throw new ApiError(404, "NOT_FOUND", "Klien tidak ditemukan");

      // 2. Generate invoice number bila kosong
      const invoiceNumber = input.invoiceNumber ?? await generateInvoiceNumber(tx, userId);

      // 3. Compute totals dengan Decimal.js
      const totals = calculateTotals(input.items, {
        discountType: input.discountType,
        discountValue: input.discountValue,
        taxRate: input.taxRate,
        shippingAmount: input.shippingAmount,
      });

      // 4. Create
      const invoice = await tx.invoice.create({
        data: {
          userId, clientId: input.clientId,
          invoiceNumber, status: input.status ?? "DRAFT",
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          currency: input.currency,
          ...totals,
          balanceDue: totals.total,
          items: { create: input.items.map((it, i) => ({ ...it, total: it.quantity * it.unitPrice, order: i })) },
          activities: { create: { type: "CREATED" } },
          publicToken: nanoid(32),
        },
        include: { client: true, items: true, payments: true, activities: true },
      });

      // 5. Side effects (jika SENT)
      if (input.status === "SENT") {
        await emailService.sendInvoice(invoice);
      }

      return invoice;
    });
  },
  // ... updateInvoice, deleteInvoice, sendInvoice, ...
};
```

---

## Data Flow End-to-End

### Skenario: User membuat invoice baru

```
[User klik "Save"]
        │
        ▼
[InvoiceForm.onSubmit]
        │ (1) Validate dengan Zod (client-side)
        ▼
[useCreateInvoice.mutate(input)]
        │ (2) Optimistic update cache TanStack Query
        ▼
[fetch POST /api/invoices, body: input]
        │ (3) Browser kirim cookie session + CSRF token
        ▼
[middleware.ts]
        │ (4) Verifikasi session → user.id; cek rate limit
        ▼
[/api/invoices/route.ts → POST handler]
        │ (5) parseBody dengan createInvoiceSchema (Zod)
        │ (6) Verifikasi CSRF token
        ▼
[invoiceService.createInvoice(user.id, input)]
        │ (7) Transaction: validasi clientId, generate number,
        │     compute totals, insert invoice + items + activity
        ▼
[Response 201 + invoice JSON]
        │
        ▼
[useCreateInvoice.onSuccess]
        │ (8) Invalidate queryKeys.invoices.* + analytics.*
        ▼
[Component re-render dengan data baru, toast success]
        │
        ▼
[router.push(`/invoices/${invoice.id}`)]
```

### Skenario: View invoice publik (token)

```
[Klien terima email link → klik]
        │
        ▼
[GET /i/<token>]                         (Next.js Server Component)
        │
        ▼
[publicInvoiceService.getByToken(token)]
        │ - Fetch invoice + company + items (no internal field)
        │ - Update viewedAt jika belum
        │ - Insert activity VIEWED
        │ - Buat notification untuk pemilik
        ▼
[Render <PublicInvoiceView>]
        │
        ▼
[HTML response] -> CDN cache 60s (versioned by updatedAt)
```

---

## State Management Strategy

| Kategori state | Tool | Alasan |
|----------------|------|--------|
| **Server cache** (data dari API) | TanStack Query | Built-in caching, optimistic, refetch logic |
| **Form state** | React Hook Form | Performant, integrate Zod |
| **URL state** (filters, page) | Next.js `useSearchParams` + `router.replace` | Shareable, browser back button works |
| **Ephemeral UI** (sidebar collapsed, theme) | Zustand persisted | Sederhana, persisted ke localStorage |
| **Cross-component event** (toast, modal) | Zustand or sonner toast helper | Imperatif lewat singleton store |
| **Auth session** | NextAuth `useSession` | Built-in |

### Anti-pattern yang dihindari
- ❌ Redux untuk server state — TanStack Query lebih cocok.
- ❌ Lifting state ke root component — cukup berat untuk app besar.
- ❌ Context untuk data API — re-render unnecessary; gunakan TanStack Query.

### Zustand store structure

```ts
// src/store/sidebar-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (c: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "if-sidebar" }
  )
);
```

---

## Caching Architecture

InvoiceForge punya **4 lapis cache**:

```
[Browser] -> [CDN] -> [Server Cache] -> [Redis] -> [DB]
   ^             ^           ^             ^
   │             │           │             │
   TanStack     Cloudflare  Next.js       Upstash
   Query        / Vercel    fetch cache   (computed
   (in-mem)     edge        + RSC cache    analytics)
```

### Layer 1 — Browser (TanStack Query)
- `staleTime`: 30s–10m per domain (lihat `docs/HOOKS.md`).
- Memory only (default), `gcTime` = TTL eviction.
- Persist ke `localStorage` opsional (untuk offline) — **future**.

### Layer 2 — CDN (Cloudflare / Vercel Edge)
- Static assets: `public/`, `/_next/static` → 1 tahun, `immutable`.
- Public invoice page: 60 detik (versioned by `updatedAt`).
- HTML pages dinamis: `Cache-Control: no-store` (data privat).

### Layer 3 — Next.js Fetch Cache & RSC Cache
- `revalidate` per fetch atau per route.
- Tag-based revalidation (`revalidateTag("invoices")`).

### Layer 4 — Redis (Upstash)
Disimpan di Redis:
- Rate limit counters.
- Computed analytics (TTL 5 menit) — re-compute jika cache miss.
- Session blacklist (opsional).
- Distributed lock (untuk recurring generator, mencegah duplikat).

### Cache invalidation rules
- **Mutation** → `queryClient.invalidateQueries(...)` di hook layer.
- **Cross-domain** (mis. payment mempengaruhi invoice + analytics) → invalidate semua key relevan.
- **Time-based** → `staleTime` mengatur kapan data dianggap perlu refetch.

---

## Error Handling Strategy

### Hierarki

```
[Throw / Reject]
       │
       ▼
[Service layer throws ApiError(status, code, msg, details)]
       │
       ▼
[Route Handler catch → format response JSON]
       │
       ▼
[Client fetcher rejects with ApiError instance]
       │
       ▼
[TanStack Query onError → toast / set form error]
       │
       ▼
[ErrorBoundary fallback (jika tidak tertangani)]
       │
       ▼
[Sentry capture (logger.error → Sentry.captureException)]
```

### `ApiError` class
```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ path: string; message: string }>,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

### Standard route handler shape
```ts
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireUser();
    const input = await parseBody(req, schema);
    const result = await service.doSomething(user.id, input);
    return ok(result);
  } catch (err) {
    return handleApiError(err, requestId);
  }
}

function handleApiError(err: unknown, requestId: string) {
  if (err instanceof ApiError) {
    return Response.json({ ok: false, error: { ...err, requestId } }, { status: err.status });
  }
  logger.error({ err, requestId }, "Unhandled API error");
  Sentry.captureException(err, { tags: { requestId } });
  return Response.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan", requestId } },
    { status: 500 }
  );
}
```

### Client-side error handling
```ts
// Default mutation onError di src/lib/query-client.ts
mutations: {
  onError: (error) => {
    if (error instanceof ApiError) {
      if (error.status === 401) router.push("/login?reason=expired");
      else if (error.status >= 500) toast.error("Server error, coba lagi sebentar lagi");
      else toast.error(error.message);
    } else {
      toast.error("Tidak terhubung. Cek koneksi.");
    }
  },
},
```

---

## Concurrency & Race Conditions

### Risiko & mitigasi

#### 1. Penomoran invoice
**Risk:** 2 user / request bersamaan dapat invoice number sama.
**Mitigasi:** Generate dalam transaction dengan SELECT ... FOR UPDATE (Postgres) atau retry on unique constraint violation:

```ts
async function generateInvoiceNumber(tx: PrismaTransactionClient, userId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const company = await tx.company.findUniqueOrThrow({ where: { userId } });
    const year = new Date().getFullYear();
    const last = await tx.invoice.findFirst({
      where: { userId, invoiceNumber: { startsWith: `${company.invoicePrefix}-${year}-` } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    const nextSeq = last ? parseInt(last.invoiceNumber.split("-")[2], 10) + 1 : 1;
    const candidate = `${company.invoicePrefix}-${year}-${nextSeq.toString().padStart(4, "0")}`;
    try {
      await tx.invoice.create({ data: { /* dummy check via constraint */ } });
      return candidate;
    } catch (err) {
      if (isUniqueConstraint(err)) continue;
      throw err;
    }
  }
  throw new Error("Tidak dapat membuat nomor invoice unik");
}
```

#### 2. Recurring invoice generation
**Risk:** Cron jalan 2x dalam window dekat → invoice duplikat.
**Mitigasi:**
- Idempotency key: hash(`${parentId}-${recurringNext.toISOString()}`).
- Distributed lock di Redis (`SET lock:recurring:<userId> NX EX 600`).

#### 3. Payment recording
**Risk:** Dua payment masuk bersamaan → balanceDue salah.
**Mitigasi:** Transaction + recompute. Database constraint `balanceDue >= 0`.

#### 4. Status transition
**Risk:** Invoice jadi PAID lalu user record payment lagi.
**Mitigasi:** State machine di service:

```ts
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"],
  VIEWED: ["PARTIAL", "PAID", "OVERDUE", "CANCELLED"],
  PARTIAL: ["PAID", "OVERDUE", "CANCELLED"],
  OVERDUE: ["PARTIAL", "PAID", "CANCELLED"],
  PAID: [], // terminal
  CANCELLED: [], // terminal
};
```

---

## Background Jobs

### Job runner choice
- MVP: **Vercel Cron** (HTTP-triggered) — sederhana, terintegrasi.
- Future: **Upstash QStash** atau **BullMQ** (Redis) untuk job dengan retry/delay/queue.

### Daftar job utama

| Job | Trigger | Logic |
|-----|---------|-------|
| `mark-overdue` | Daily 00:05 WIB | UPDATE invoices SET status=OVERDUE WHERE status IN (SENT,VIEWED) AND dueDate<now |
| `send-reminders` | Daily 09:00 WIB | Loop invoice OVERDUE → kirim email reminder (T+1, T+7, T+14) |
| `recurring-invoices` | Hourly | Loop invoice template `recurringNext<=now` → generate child + email |
| `cleanup-tokens` | Daily 00:00 WIB | DELETE expired PasswordReset, VerificationToken |
| `cleanup-soft-deleted` | Weekly | HARD DELETE record dengan deletedAt > 90 days |
| `backup-db` | Daily 02:00 WIB | pg_dump → S3 |

### Pattern (cron handler)

```ts
// src/app/api/cron/mark-overdue/route.ts
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const startedAt = Date.now();
  const result = await invoiceService.markOverdue();
  logger.info({ ...result, durationMs: Date.now() - startedAt }, "mark-overdue done");
  return Response.json({ ok: true, ...result });
}
```

---

## Folder Layout & Module Boundaries

### Aturan import
- `src/lib/*` — boleh diimport oleh siapa saja.
- `src/services/*` — boleh diimport server-side saja (`'server-only'` directive).
- `src/components/*` — UI saja, **tidak boleh** import service.
- `src/hooks/*` — boleh import dari `src/lib`, tapi **tidak boleh** import service.
- `src/types/*` — boleh diimport oleh siapa saja.

### `'server-only'` enforcement
File yang server-only harus mulai dengan:
```ts
import "server-only";
```
Jika tidak sengaja diimport di Client Component, build akan **fail**.

### Module boundaries (mental model)

```
src/components → src/hooks → fetch API → src/app/api → src/services → src/lib/prisma
   (UI)           (state)                   (HTTP)        (logic)          (DB)
```

---

## Cross-Cutting Concerns

### Logging
- **Pino** dengan structured JSON.
- Setiap request: `requestId`, `userId`, `path`, `method`, `status`, `durationMs`.
- Sensitive field di-redact (`authorization`, `password`).

### i18n
- Default `id-ID`. English fallback.
- Pakai `next-intl` (future) atau lib internal sederhana.
- String UI di file terpisah `messages/{locale}.json`.

### Date & timezone
- Server pakai UTC internal.
- Display pakai timezone user (`Asia/Jakarta` default).
- Helper: `formatDate(date, { locale, timeZone })`.

### Money
- Service & DB pakai unit utama (rupiah penuh).
- Computation pakai `Decimal.js`.
- Format pakai `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })`.

### Feature flags
- Sederhana via env: `FEATURE_X=true|false`.
- Future: dynamic flag via Posthog atau ConfigCat.

---

## Architectural Decision Records

Berikut ADR penting yang membentuk arsitektur ini:

### ADR-001: Next.js App Router (bukan Pages Router)
**Konteks:** Pages Router stable, App Router relatif baru.
**Keputusan:** App Router.
**Alasan:** RSC streaming, server actions, layouts nested, masa depan Next.js. RSC mengurangi bundle client.
**Konsekuensi:** Tim harus paham boundary RSC vs Client.

### ADR-002: Prisma + SQLite (dev) → PostgreSQL (prod)
**Konteks:** Pilih ORM dan DB.
**Keputusan:** Prisma. SQLite dev, PG prod.
**Alasan:** Prisma type-safe, mature; SQLite zero-config; PG mature di prod.
**Konsekuensi:** Tipe data tertentu (enum, array) harus di-emulate di SQLite. Migration ulang saat switch.

### ADR-003: NextAuth.js v5 (Auth.js)
**Konteks:** Auth solusi.
**Keputusan:** NextAuth v5.
**Alasan:** Industry standard, multi-provider, prisma adapter siap, session management built-in.
**Konsekuensi:** Beberapa quirk v5 beta (tetap pakai sampai stable).

### ADR-004: TanStack Query untuk server state
**Konteks:** Pilih state management server.
**Keputusan:** TanStack Query.
**Alasan:** Caching, optimistic update, retry, DevTools.
**Konsekuensi:** Tim harus disiplin query-key.

### ADR-005: Zod untuk validasi end-to-end
**Konteks:** Validasi.
**Keputusan:** Zod schema dipakai di FE & BE.
**Alasan:** Type inference, single source of truth.
**Konsekuensi:** Schema harus serializable (jangan refer ke runtime obj).

### ADR-006: shadcn/ui (own the code)
**Konteks:** UI library.
**Keputusan:** shadcn/ui (Radix base) + Tailwind.
**Alasan:** Headless, customizable, code di repo (bisa modify).
**Konsekuensi:** Maintenance manual saat upstream update.

### ADR-007: @react-pdf/renderer untuk PDF
**Konteks:** Generate PDF invoice.
**Keputusan:** @react-pdf/renderer (server-side).
**Alasan:** JSX-based, tidak butuh headless browser, ringan.
**Konsekuensi:** Layout tidak persis seperti CSS web (ada keterbatasan).

### ADR-008: Soft delete bukan hard delete
**Konteks:** UX delete.
**Keputusan:** Soft delete (deletedAt) untuk Invoice, Client, Payment.
**Alasan:** Recoverable, audit-friendly, mencegah orphan FK.
**Konsekuensi:** Semua query harus include `deletedAt: null`. Hard delete via cron 90 hari.

### ADR-009: Decimal.js untuk money
**Konteks:** JS Number imprecision.
**Keputusan:** Pakai Decimal.js di service layer untuk semua calculation.
**Alasan:** Avoid floating-point bug.
**Konsekuensi:** Tambah dependency 27 KB; konversi number ↔ Decimal di boundary.

### ADR-010: Resend untuk email
**Konteks:** Email provider.
**Keputusan:** Resend.
**Alasan:** Modern API, react-email integration, free tier 3k/bulan.
**Konsekuensi:** Vendor lock-in (mitigasi: wrapper service).

### ADR-011: Upstash Redis untuk rate-limit & cache
**Konteks:** Need shared state untuk rate-limit cross-instance.
**Keputusan:** Upstash Redis.
**Alasan:** REST API serverless-friendly, free tier.
**Konsekuensi:** Latency Redis call (mitigasi: gunakan `waitUntil`).

### ADR-012: Vercel sebagai hosting default
**Konteks:** Hosting.
**Keputusan:** Vercel (default), self-host Docker tersedia.
**Alasan:** Zero-config Next.js, edge network.
**Konsekuensi:** Vendor lock-in. Mitigasi: Dockerfile + standalone output.

---

## Diagram alur autentikasi

```
[User] ───POST /api/auth/callback/credentials───► [NextAuth]
                                                       │
                                              ┌────────┴────────┐
                                              ▼                 ▼
                                        [Validate Zod]     [Rate-limit]
                                              │
                                              ▼
                                       [User.findUnique]
                                              │
                                  ┌───────────┴───────────┐
                                  ▼                       ▼
                        [Locked? Yes → 423]    [bcrypt.compare]
                                                        │
                                              ┌─────────┴─────────┐
                                              ▼                   ▼
                                    [Match: issue JWT]    [Mismatch: count++]
                                              │                   │
                                              ▼                   ▼
                                  [Set cookie]            [≥5: lock 15m]
                                              │
                                              ▼
                                    [Redirect /dashboard]
```

---

## Performance budget

| Metric | Target | Hard limit |
|--------|--------|------------|
| LCP (mobile 4G) | < 1.5s | 2.5s |
| FID / INP | < 100ms | 200ms |
| CLS | < 0.1 | 0.25 |
| Initial JS (gz) | < 350 KB | 500 KB |
| API p95 | < 300ms | 1s |
| DB query p95 | < 50ms | 200ms |

Pemantauan via Lighthouse CI + Sentry performance.
