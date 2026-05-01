# InvoiceForge — Testing Strategy

Dokumen ini menjelaskan strategi pengujian InvoiceForge: piramida test, tooling, test cases, dan praktik penulisan tes.

---

## Daftar Isi
1. [Tooling](#tooling)
2. [Test Pyramid](#test-pyramid)
3. [Coverage Targets](#coverage-targets)
4. [Konvensi & Struktur](#konvensi--struktur)
5. [Test Data Factories](#test-data-factories)
6. [Unit Test Cases](#unit-test-cases)
7. [Integration Test Cases](#integration-test-cases)
8. [E2E Test Scenarios](#e2e-test-scenarios)
9. [Component Test Cases](#component-test-cases)
10. [Accessibility Tests](#accessibility-tests)
11. [Performance Tests](#performance-tests)
12. [Security Tests](#security-tests)
13. [CI Pipeline](#ci-pipeline)

---

## Tooling

| Layer | Tool | Alasan |
|-------|------|--------|
| Unit & Integration | **Vitest** | Cepat, ESM native, kompat Vite |
| Component | **@testing-library/react** + Vitest | User-centric API |
| API mocking | **MSW (Mock Service Worker)** | Network-level mock, test real fetch flow |
| E2E | **Playwright** | Cross-browser, parallel, traces |
| A11y | **axe-core** + **@axe-core/playwright** | WCAG validator |
| Visual regression | **Playwright snapshot** atau Percy (future) | UI consistency |
| Coverage | **@vitest/coverage-v8** + Codecov | Coverage tracking |
| Load | **k6** (future) | Load testing API |

---

## Test Pyramid

```
        ▲
      ▲▲▲▲▲          E2E (~5%)         — Smoke critical user flows
    ▲▲▲▲▲▲▲▲▲      Integration (~25%) — API routes + DB (Prisma)
  ▲▲▲▲▲▲▲▲▲▲▲▲▲    Unit (~70%)         — Pure functions, hooks, components
```

**Prioritas:**
- Logic bisnis kritis (calculate totals, status transition) → unit + integration.
- User flow utama (create invoice, mark paid) → E2E.
- UI komponen → component test (RTL).

---

## Coverage Targets

| Metric | Minimum | Target |
|--------|---------|--------|
| Lines | 70% | 85% |
| Branches | 60% | 80% |
| Functions | 70% | 85% |
| Statements | 70% | 85% |

**Coverage threshold ini dienforce di CI** (vitest config). PR yang menurunkan coverage akan reject.

**Pengecualian:**
- File `*.config.ts`, `prisma/seed.ts`, `__mocks__/*` di-exclude.
- Server boundary (`api/.../route.ts`) target 90% (kritis).
- Service layer target 95%.

---

## Konvensi & Struktur

### Lokasi file
```
src/
  lib/
    utils.ts
    utils.test.ts            # co-located unit test
  services/
    invoice.service.ts
    invoice.service.test.ts  # integration (uses test DB)
test/
  setup.ts                   # vitest setup
  factories/                 # test data factories
  mocks/                     # MSW handlers
  helpers/                   # test utilities
  e2e/                       # Playwright tests
    auth.spec.ts
    invoice-flow.spec.ts
```

### Naming
- File: `*.test.ts` / `*.test.tsx` (unit/integration), `*.spec.ts` (E2E).
- Test: `it("should ...")` atau `it("...berfungsi seperti ...")`.
- Group: `describe("<feature>", () => ...)`.

### AAA pattern
```ts
it("menghitung total dengan diskon persentase", () => {
  // Arrange
  const items = [{ quantity: 2, unitPrice: 100_000 }];
  // Act
  const total = calculateTotal(items, { discountType: "PERCENTAGE", discountValue: 10 });
  // Assert
  expect(total).toBe(180_000);
});
```

### Setup file
```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### Test database
Untuk integration test:
- Pakai SQLite di `:memory:` (fast, isolated).
- Reset via `prisma.$executeRaw` truncate setiap test.
- Fixture user via factory.

```ts
// test/helpers/db.ts
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

export async function setupTestDb(): Promise<PrismaClient> {
  process.env.DATABASE_URL = "file::memory:?cache=shared";
  execSync("pnpm prisma migrate deploy", { env: process.env });
  return new PrismaClient();
}
```

---

## Test Data Factories

`test/factories/index.ts` — pakai pattern factory dengan `faker`:

```ts
import { faker } from "@faker-js/faker";
import type { Invoice, Client, User, Company } from "@prisma/client";

faker.seed(42); // reproducible

export const userFactory = {
  build(overrides: Partial<User> = {}): Omit<User, "id" | "createdAt" | "updatedAt"> {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "$2a$12$hash...", // bcrypt of "password123"
      role: "USER",
      locale: "id-ID",
      timezone: "Asia/Jakarta",
      emailVerified: null,
      image: null,
      lastLoginAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
      ...overrides,
    };
  },
  async create(prisma: PrismaClient, overrides: Partial<User> = {}) {
    return prisma.user.create({ data: this.build(overrides) });
  },
};

export const clientFactory = {
  build(userId: string, overrides: Partial<Client> = {}) {
    return {
      userId,
      name: faker.company.name(),
      company: faker.company.name(),
      email: faker.internet.email(),
      phone: "+6281234567890",
      address: faker.location.streetAddress(),
      city: "Jakarta",
      province: "DKI Jakarta",
      country: "Indonesia",
      isActive: true,
      ...overrides,
    };
  },
  async create(prisma, userId, overrides = {}) {
    return prisma.client.create({ data: this.build(userId, overrides) });
  },
};

export const invoiceFactory = {
  build(userId: string, clientId: string, overrides = {}) {
    const items = [{ name: "Service", quantity: 1, unitPrice: 1_000_000, total: 1_000_000, order: 0 }];
    const subtotal = 1_000_000;
    const taxRate = 11;
    const taxAmount = subtotal * (taxRate / 100);
    return {
      userId,
      clientId,
      invoiceNumber: `INV-2026-${faker.string.numeric(4)}`,
      status: "DRAFT" as const,
      issueDate: new Date(),
      dueDate: faker.date.future(),
      currency: "IDR",
      exchangeRate: 1,
      subtotal,
      taxRate,
      taxAmount,
      total: subtotal + taxAmount,
      paidAmount: 0,
      balanceDue: subtotal + taxAmount,
      items: { create: items },
      ...overrides,
    };
  },
};

// ... companyFactory, paymentFactory, dst.
```

### Snapshot factory
Untuk komponen yang rumit, simpan snapshot fixture di `test/fixtures/`:

```
test/fixtures/
  invoice-paid.json       # mock invoice status PAID
  invoice-overdue.json    # mock invoice OVERDUE
  client-with-stats.json
```

---

## Unit Test Cases

### `lib/utils/calculate-totals.ts`
- ✅ Subtotal = sum(quantity × unitPrice).
- ✅ Discount percentage: 10% dari 100 = 10.
- ✅ Discount fixed: kurangi nominal langsung.
- ✅ Tax dihitung dari (subtotal - discount).
- ✅ Tax hanya dihitung dari item yang `taxable=true`.
- ✅ Total = subtotal - discount + tax + shipping.
- ✅ Floating point precision (gunakan Decimal.js).
- ✅ Empty items → subtotal = 0, total = 0.
- ✅ Negative item → throw error (validasi sebelumnya).
- ✅ Discount > subtotal → discount = subtotal (clamp).

### `lib/utils/format-currency.ts`
- ✅ IDR: `formatCurrency(1500000) === "Rp1.500.000"`.
- ✅ USD: `formatCurrency(1500.5, "USD", "en-US") === "$1,500.50"`.
- ✅ Compact: `formatCompact(1_500_000) === "Rp1,5 jt"`.
- ✅ Locale id-ID untuk separator titik.
- ✅ Negative: `Rp-1.500.000`.
- ✅ Zero: `Rp0`.
- ✅ Null/undefined → "-".

### `lib/utils/format-date.ts`
- ✅ Format Indonesia: `30 April 2026`.
- ✅ Relative: `3 hari yang lalu`.
- ✅ Range: `01 - 30 April 2026`.
- ✅ Range cross month: `25 Apr - 5 Mei 2026`.
- ✅ Timezone Asia/Jakarta default.

### `lib/utils/generate-invoice-number.ts`
- ✅ Format: `{prefix}-{year}-{nnnn}`.
- ✅ `nnnn` zero-padded 4 digit.
- ✅ Reset counter setiap tahun.
- ✅ Concurrent generation tidak duplicate (transaction + retry).
- ✅ Custom prefix dari company.

### `lib/utils/parse-currency.ts`
- ✅ `"Rp 1.500.000"` → 1500000.
- ✅ `"1.500.000"` → 1500000.
- ✅ `"$ 1,500.50"` → 1500.50.
- ✅ Empty / invalid → null.

### `lib/validations/invoice.ts` (Zod)
- ✅ Valid input → success.
- ✅ Missing clientId → fail with path `clientId`.
- ✅ dueDate < issueDate → fail with custom message.
- ✅ Items kosong → fail.
- ✅ Items > 100 → fail.
- ✅ unitPrice negative → fail.
- ✅ taxRate > 100 → fail.

### `lib/auth/password.ts`
- ✅ Hash valid (bcrypt format).
- ✅ Compare hash benar.
- ✅ Strength: <8 chars → reject.
- ✅ Strength: tanpa angka → reject.
- ✅ Strength: tanpa simbol → reject.

### `lib/crypto/field-encryption.ts`
- ✅ Encrypt → decrypt = original.
- ✅ Encrypt 2x → ciphertext berbeda (random IV).
- ✅ Tampered ciphertext → throw.
- ✅ Wrong key → throw.

### `services/invoice.service.ts`
- ✅ `createInvoice` valid → return invoice with computed totals.
- ✅ `createInvoice` auto-generate invoiceNumber jika kosong.
- ✅ `createInvoice` throw jika clientId bukan milik user.
- ✅ `updateInvoice` PAID → throw (only notes allowed).
- ✅ `updateInvoice` recalculate totals saat items berubah.
- ✅ `markOverdue` ubah status untuk dueDate < now & status SENT/VIEWED.
- ✅ `recordPayment` update paidAmount + status transition.
- ✅ `recordPayment` amount > balanceDue → throw.
- ✅ `cancelInvoice` set status CANCELLED + cancelledAt.

### `services/payment.service.ts`
- ✅ Create payment → invoice.paidAmount += amount.
- ✅ Lunas → status = PAID, paidAt set.
- ✅ Sebagian → status = PARTIAL.
- ✅ Delete payment → recalculate, mungkin balik ke SENT/OVERDUE.
- ✅ Multiple partial payments → akumulasi benar.

### `services/recurring.service.ts`
- ✅ Generate next invoice dari template.
- ✅ Hitung next due date sesuai cycle (MONTHLY → +1 month).
- ✅ recurringEnd terlewati → tidak generate.
- ✅ Skip jika sudah generate (idempotent via lock).

### `hooks/useInvoiceTotals.ts`
- ✅ Recalculate saat items berubah.
- ✅ Memoized — tidak recompute jika input sama.
- ✅ Discount type & value berubah → re-render.

### `hooks/useDebounce.ts`
- ✅ Setelah delay → value berubah.
- ✅ Sebelum delay → value tetap.
- ✅ Cleanup pada unmount.

---

## Integration Test Cases

### API Routes (dengan test DB)

#### `POST /api/auth/register`
- ✅ Valid → 201 + user dibuat + company dibuat.
- ✅ Email duplikat → 409.
- ✅ Password lemah → 400.
- ✅ Rate limit terlewati → 429.

#### `POST /api/auth/login`
- ✅ Valid → 200 + cookie session.
- ✅ Wrong password → 401, increment failedLoginCount.
- ✅ 5x salah → akun lock, lockedUntil set.
- ✅ Login saat locked → 423.
- ✅ Login sukses setelah lock expire.

#### `GET /api/invoices`
- ✅ Default (no params) → return invoices user.
- ✅ Filter status → hanya status itu.
- ✅ Pagination → respect page/perPage.
- ✅ User lain tidak terlihat.
- ✅ Soft-deleted tidak ter-include.
- ✅ Tanpa session → 401.

#### `POST /api/invoices`
- ✅ Valid → 201 dengan invoice.
- ✅ Auto-generate invoiceNumber.
- ✅ clientId user lain → 403/404.
- ✅ Items kosong → 400.
- ✅ Idempotency-Key sama 2x → return result yang sama.
- ✅ Total perhitungan akurat.
- ✅ Activity CREATED dibuat.

#### `PUT /api/invoices/:id`
- ✅ Owner → success.
- ✅ Bukan owner → 404 (jangan reveal existence).
- ✅ Status PAID → 422 untuk field selain notes.
- ✅ Update items → recalculate totals.

#### `DELETE /api/invoices/:id`
- ✅ DRAFT → success (soft delete).
- ✅ PAID → 422 (must cancel first).
- ✅ Activity DELETED log.

#### `POST /api/invoices/:id/send`
- ✅ Sukses → status SENT, sentAt, MSW receives email mock.
- ✅ Tanpa client.email → 400.
- ✅ Rate limit per invoice → reject 11th in 1h.

#### `POST /api/payments`
- ✅ Sukses → invoice.paidAmount + balanceDue update.
- ✅ Lunas → invoice.status = PAID, paidAt set.
- ✅ Sebagian → status = PARTIAL.
- ✅ amount > balanceDue → 400.
- ✅ Invoice CANCELLED → 400.

#### `GET /api/clients`
- ✅ Search by name/email/company.
- ✅ Filter isActive.
- ✅ Stats included (count invoice, revenue).

#### `DELETE /api/clients/:id`
- ✅ Tanpa invoice aktif → success.
- ✅ Punya invoice non-DRAFT/CANCELLED → 409.

#### `GET /api/analytics/overview`
- ✅ Range 30d → return KPI dengan compare period.
- ✅ Range custom → respect from/to.
- ✅ Hanya data user yang login.

#### `GET /api/public/invoices/:token`
- ✅ Token valid → return invoice publik.
- ✅ Token invalid → 404.
- ✅ Side effect: viewedAt update + status SENT→VIEWED.
- ✅ Token rate-limited per IP.

#### `POST /api/cron/mark-overdue`
- ✅ Tanpa Authorization → 401.
- ✅ Authorization wrong → 401.
- ✅ Authorization ok → mark invoices SENT/VIEWED dueDate<now → OVERDUE.

### Service + DB integration

#### Invoice number concurrency
- ✅ 10 concurrent createInvoice → 10 invoice number unik (transaction lock).

#### Recurring generation
- ✅ Cron job: invoice template `recurringNext <= now` → child invoice dibuat.
- ✅ Idempotent — jalankan 2x dalam 1 jam tidak duplicate.

---

## E2E Test Scenarios

Tulis di `test/e2e/*.spec.ts` (Playwright). Setiap test setup user via API + DB seed.

### `auth.spec.ts`
- ✅ User register → redirect dashboard.
- ✅ User register dengan email exist → error toast.
- ✅ User login → redirect dashboard.
- ✅ User login wrong password → error.
- ✅ Forgot password → email sent (cek MSW intercept).
- ✅ Reset password → bisa login dengan password baru.
- ✅ Logout → redirect /login.

### `invoice-flow.spec.ts` (golden path)
1. Login.
2. Buka `/invoices/create`.
3. Pilih client (atau create inline).
4. Tambah 2 item.
5. Set due date 30 hari.
6. Klik Save → status DRAFT.
7. Klik Send → konfirmasi modal → kirim → status SENT.
8. Cek email dikirim (MSW assert).
9. Klik "Record Payment" → input amount full → save.
10. Status berubah ke PAID, balanceDue 0.
11. Download PDF → verifikasi konten.
12. Buka /dashboard → revenue meningkat.

### `invoice-edit.spec.ts`
- ✅ Edit DRAFT → save → reflect di list.
- ✅ Edit PAID → field disabled (kecuali notes).
- ✅ Cancel invoice → status CANCELLED, tidak bisa diedit.

### `client-management.spec.ts`
- ✅ Create client.
- ✅ Edit client.
- ✅ Delete client tanpa invoice → success.
- ✅ Delete client dengan invoice → error dialog.

### `dashboard.spec.ts`
- ✅ KPI cards menampilkan data yang benar.
- ✅ Revenue chart muncul.
- ✅ Recent invoices table 5 row.
- ✅ Klik row → navigate ke detail.

### `analytics.spec.ts`
- ✅ Filter date range → chart update.
- ✅ Top clients chart benar.

### `reports.spec.ts`
- ✅ Income report → CSV download.
- ✅ Tax report → PDF download.

### `settings.spec.ts`
- ✅ Update company info → tersimpan.
- ✅ Upload logo → preview muncul, persist.
- ✅ Change password → harus re-enter password lama.

### `responsive.spec.ts`
- ✅ Mobile (375px): sidebar drawer berfungsi.
- ✅ Mobile: invoice form scrollable.
- ✅ Tablet (768px): layout adapt.

### `dark-mode.spec.ts`
- ✅ Toggle dark mode → CSS class berubah.
- ✅ Persist setelah refresh.
- ✅ Charts adapt warna.

### `public-invoice.spec.ts`
- ✅ Buka URL publik dengan token valid → invoice tampil.
- ✅ Klien view → status SENT→VIEWED, notification masuk untuk pemilik.
- ✅ Token invalid → halaman 404.

### `keyboard.spec.ts`
- ✅ Cmd+K → command palette open.
- ✅ Tab navigation di seluruh form.

---

## Component Test Cases

Tulis sebagai `*.test.tsx` di samping component.

### `<DataTable>`
- ✅ Render data rows.
- ✅ Sort header click → cycle asc/desc/none.
- ✅ Pagination next/prev → onPageChange called.
- ✅ Search → onSearchChange called dengan debounce.
- ✅ Selection → onSelectionChange called.
- ✅ Bulk action click → handler called dengan IDs.
- ✅ Empty state ditampilkan saat data kosong.
- ✅ Loading skeleton saat isLoading.
- ✅ Row click → onRowClick called.

### `<CurrencyInput>`
- ✅ Type "1500000" → display "Rp 1.500.000", value 1500000.
- ✅ Focus → tampilkan raw, blur → format.
- ✅ Negative tidak dipakai jika `allowNegative=false`.
- ✅ Currency USD → prefix "$".
- ✅ A11y `inputmode="numeric"`.

### `<DateRangePicker>`
- ✅ Pilih preset "7 hari terakhir" → from/to benar.
- ✅ Custom range → onChange called.
- ✅ Locale id-ID → bulan dalam Indonesia.
- ✅ Clear button → set ke null.

### `<InvoiceStatusBadge>`
- ✅ Status PAID → kelas success.
- ✅ Icon ditampilkan jika withIcon.
- ✅ Variant outline → kelas berbeda.

### `<ItemEditor>`
- ✅ Add item → onChange called dengan array baru.
- ✅ Remove item → array tanpa item itu.
- ✅ Edit qty → recalculate line total.
- ✅ Reorder via drag → array reordered.
- ✅ Read-only → tombol add hidden.

### `<PaymentDialog>`
- ✅ Render dengan invoice → amount default = balanceDue.
- ✅ Submit → useCreatePayment called dengan args.
- ✅ Validasi amount > balanceDue → error.
- ✅ Close after success.

### `<InvoiceForm>`
- ✅ Mode create → field default kosong.
- ✅ Mode edit → field pre-filled.
- ✅ Submit → onSubmit called dengan validated values.
- ✅ Validation error → field highlighted.
- ✅ Auto-save draft setelah 30 detik (mock timer).

### `<StatsCard>`
- ✅ Format currency benar.
- ✅ Change positive → ▲ hijau.
- ✅ Change negative → ▼ merah.
- ✅ isLoading → skeleton.
- ✅ href → render `<a>`.

### `<EmptyState>`
- ✅ Render title & description.
- ✅ Action button → onClick called.

### `<NotificationBell>`
- ✅ Unread count ditampilkan sebagai badge.
- ✅ Klik → buka popover dengan list.
- ✅ Klik notification → mark-read mutation.

---

## Accessibility Tests

### Per page (Playwright + axe)
```ts
import AxeBuilder from "@axe-core/playwright";

test("dashboard a11y", async ({ page }) => {
  await page.goto("/dashboard");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Per component (Vitest + jest-axe)
```ts
import { axe } from "jest-axe";

it("memiliki nol violation", async () => {
  const { container } = render(<DataTable {...props} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### Manual checklist
- [ ] Tab navigation di seluruh page bisa mencapai semua interactive.
- [ ] Focus ring visible di semua focusable.
- [ ] Screen reader (NVDA / VoiceOver) menyebutkan label benar.
- [ ] Color contrast ≥ 4.5:1 (normal), 3:1 (large text).
- [ ] Form error di-announce via `aria-live`.

---

## Performance Tests

### Bundle size
- CI step: `pnpm build` + ukur first-load JS.
- **Target:** < 200 KB gz untuk landing/login, < 350 KB untuk dashboard.
- Monitor regress via `bundle-analyzer`.

### Lighthouse CI
- Performance ≥ 90 (mobile).
- Accessibility ≥ 95.
- SEO ≥ 90.
- Best Practices ≥ 90.

### API performance
| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| GET /api/invoices | 80ms | 200ms | 500ms |
| GET /api/invoices/:id | 50ms | 150ms | 300ms |
| POST /api/invoices | 150ms | 400ms | 800ms |
| GET /api/analytics/overview | 200ms | 600ms | 1200ms |
| GET /api/public/invoices/:token | 80ms | 200ms | 500ms |

### Load test (k6, future)
```js
import http from "k6/http";
export const options = {
  vus: 50,
  duration: "5m",
  thresholds: { http_req_duration: ["p(95)<400"] },
};
export default function () {
  http.get(`${__ENV.BASE_URL}/api/invoices`, { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } });
}
```

---

## Security Tests

### Otomatis (CI)
- `pnpm audit` — dependency CVE.
- ESLint security plugin.
- Snyk/Dependabot.

### Manual / scripted
- ✅ IDOR — coba akses resource user lain via direct ID → expect 404.
- ✅ CSRF — POST tanpa header CSRF → 403.
- ✅ SQL injection — Zod menolak `'; DROP TABLE users; --`.
- ✅ XSS — input dengan `<script>` di notes → di-render sebagai text.
- ✅ Mass assignment — kirim field `userId`/`role` dari user → diabaikan.
- ✅ Rate limit — 100 req cepat ke /login → 429 setelah 5 req.
- ✅ JWT manipulation — ubah role di JWT payload → signature mismatch → reject.

---

## CI Pipeline

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma generate
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage
      - run: pnpm build
      - uses: codecov/codecov-action@v4
  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm test:e2e
```

### Required for merge (branch protection)
- ✅ Lint pass.
- ✅ TypeCheck pass.
- ✅ Unit + Integration test pass.
- ✅ Coverage ≥ threshold.
- ✅ E2E smoke pass.
- ✅ Build pass.
- ✅ 1 reviewer approval.

---

## Test Data — Realistic Scenarios

Untuk test deterministic, simpan beberapa skenario di `test/fixtures/scenarios.ts`:

```ts
export const scenarios = {
  freelancer: {
    user: { name: "Andi Freelancer", email: "andi@test.local" },
    company: { name: "Andi Studio", isPkp: false, taxRate: 0, currency: "IDR" },
    clients: [/* 5 clients */],
    invoices: [/* 12 invoices distributed across statuses */],
    payments: [/* 8 payments */],
  },
  smallBusiness: {
    user: { name: "Sari UMKM" },
    company: { name: "Sari Bakery", isPkp: true, taxRate: 11 },
    clients: [/* 20 */],
    invoices: [/* 80 */],
  },
  agency: {
    user: { name: "Agency Owner" },
    company: { name: "Creative Agency", isPkp: true, taxRate: 11, paymentTerms: 60 },
    clients: [/* 50 corporate */],
    invoices: [/* 200, multi-currency */],
  },
};
```

Loader: `await loadScenario("smallBusiness", prisma)`.

---

## Tips Praktis

1. **Mock di-level network** (MSW), bukan di-level fungsi (lebih realistis).
2. **Hindari sleep arbitrer.** Pakai `waitFor` / `await screen.findBy*`.
3. **Bersihkan state** antar test (teardown DB, MSW reset).
4. **Avoid testing implementation detail.** Test perilaku user-visible.
5. **Coverage bukan tujuan, bug-prevention adalah tujuan.** Test kasus tepi (edge), bukan duplikasi line.
6. **Speed matters.** Target unit test < 50ms/test. Total suite < 2 menit.
7. **Flaky test = bug.** Kalau ada flaky, jangan retry, perbaiki.
