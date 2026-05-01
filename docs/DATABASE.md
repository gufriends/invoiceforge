# InvoiceForge — Database Documentation

Dokumen ini menjelaskan desain database InvoiceForge: relasi, indexing, migration, seeding, dan optimasi query.

> Schema lengkap: `prisma/schema.prisma`. Dokumen ini menjelaskan **mengapa** dan **bagaimana**, bukan hanya **apa**.

---

## Daftar Isi
1. [Pilihan Teknologi](#pilihan-teknologi)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Penjelasan Tabel & Relasi](#penjelasan-tabel--relasi)
4. [Index Strategy](#index-strategy)
5. [Soft Delete Strategy](#soft-delete-strategy)
6. [Money & Decimal Handling](#money--decimal-handling)
7. [Migration Plan](#migration-plan)
8. [Seed Data](#seed-data)
9. [Query Optimization](#query-optimization)
10. [Backup & Recovery](#backup--recovery)
11. [Multi-Tenancy](#multi-tenancy)

---

## Pilihan Teknologi

| Aspek | Pilihan | Alasan |
|-------|---------|--------|
| Development DB | **SQLite** (file local) | Zero-config, cepat untuk iterasi, cukup untuk single-user testing |
| Production DB | **PostgreSQL 16** | Concurrency, full-text search, JSON ops, mature ecosystem |
| ORM | **Prisma 5** | Type-safe, migration tooling, query builder, ekosistem Next.js |
| Connection pooling | **PgBouncer** atau Prisma Accelerate | Hindari saturasi connection pada serverless |
| Read replica | Future (≥ 1000 DAU) | Read-heavy queries (analytics) bisa di-offload |

**Trade-off SQLite vs Postgres:**
- SQLite tidak punya `enum`, `array`, atau full-text di Prisma → kita pakai string + `JSON.stringify`/`split(',')`. Saat migrate ke Postgres, lakukan kolom-kolom tersebut migration tambahan untuk konversi tipe.
- Saat development, **gunakan SQLite**. Sebelum production, **switch provider** dan generate migration baru.

---

## Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐
│      User        │ 1     1 │    Company       │
│ id, email, role  │─────────│ npwp, bankInfo   │
└─┬────┬───────┬──┘         └──────────────────┘
  │    │       │
  │    │       │ 1..N
  │    │       └──────────► ┌──────────────┐
  │    │                    │   Client     │  1..N    ┌─────────────┐
  │    │                    │ name, email  │──────────│  Invoice    │
  │    │                    │ npwp, tags   │          │ number,     │
  │    │                    └──────────────┘          │ status,     │
  │    │                                               │ totals      │
  │    │ 1..N                                          └──┬────┬────┘
  │    └─────────────────────────────────────────────────┘    │
  │                                                            │
  │                                                       1..N │
  │                                                            ▼
  │                                                     ┌──────────────┐
  │                                                     │ InvoiceItem  │
  │                                                     │ qty, price   │
  │                                                     └──────────────┘
  │
  │ 1..N                  ┌──────────────┐
  ├────────────────────►  │   Payment    │  N..1   (FK → Invoice)
  │                       │ amount, date │
  │                       └──────────────┘
  │
  │ 1..N                  ┌──────────────┐
  ├────────────────────►  │ Notification │
  │                       │ type, title  │
  │                       └──────────────┘
  │
  │ 1..N                  ┌──────────────┐
  ├────────────────────►  │   ApiKey     │
  │                       │ keyHash      │
  │                       └──────────────┘
  │
  │ 1..N                  ┌──────────────┐
  └────────────────────►  │  AuditLog    │
                          │ action, ip   │
                          └──────────────┘

   Invoice 1 ─── N InvoiceActivity (timeline)
   Invoice 1 ─── N (self) Invoice (recurring children)
```

### Cardinalitas

| Relasi | Tipe | Cascade |
|--------|------|---------|
| User → Company | 1..1 | onDelete: Cascade |
| User → Clients | 1..N | onDelete: Cascade |
| User → Invoices | 1..N | onDelete: Cascade |
| Client → Invoices | 1..N | onDelete: **Restrict** (jangan hapus client yang punya invoice) |
| Invoice → InvoiceItem | 1..N | onDelete: Cascade |
| Invoice → Payment | 1..N | onDelete: Cascade |
| Invoice → InvoiceActivity | 1..N | onDelete: Cascade |
| Invoice → Invoice (recurring parent/children) | self-relation | onDelete: SetNull |
| User → Notification | 1..N | onDelete: Cascade |
| User → ApiKey | 1..N | onDelete: Cascade |

---

## Penjelasan Tabel & Relasi

### `User`
Inti otentikasi. Field penting:
- `password` nullable — agar OAuth-only login (Google) bisa register tanpa password.
- `role` — `USER | ADMIN | SUPER_ADMIN`. Admin untuk dashboard internal (impersonate, support).
- `failedLoginCount` + `lockedUntil` — brute-force protection (5x salah → lock 15 menit).
- `locale` & `timezone` — untuk i18n & date formatting; default `id-ID`/`Asia/Jakarta`.

### `Company`
1:1 dengan User. Dipisah dari User karena:
- Field cukup banyak (≥ 25 kolom).
- Logikanya berbeda (profil bisnis, bukan profil orang).
- Future: bisa support multi-company per user (tinggal ubah relasi).

`isPkp` (Pengusaha Kena Pajak) penting karena hanya PKP yang wajib mencetak PPN.

### `Client`
- `userId + email` unique → mencegah duplikat per pemilik (bukan global).
- `tags` disimpan sebagai string (JSON serialized) di SQLite. Di Postgres bisa beralih ke `text[]`.
- `deletedAt` untuk soft-delete; client yang punya invoice tidak boleh dihapus permanen (FK Restrict).

### `Invoice`
Tabel paling kompleks. Field totals (`subtotal`, `taxAmount`, `total`, `paidAmount`, `balanceDue`) **disimpan persisted** meskipun dapat dihitung ulang dari items + payments. Alasannya:
1. **Historical accuracy** — jika tax rate berubah di company, invoice lama harus tetap menampilkan angka aslinya.
2. **Performance** — query list invoice tidak perlu join + sum.
3. **Concurrency safety** — kalkulasi dilakukan di service layer dengan transaction.

`balanceDue` = `total - paidAmount`. Disimpan agar query "invoice unpaid" cepat (`WHERE balanceDue > 0`).

`publicToken` (nanoid 32 char) digunakan untuk URL share publik (`/i/<token>`). Dibuat saat invoice pertama kali SENT.

### `InvoiceItem`
- `taxable` boolean — beberapa item mungkin tidak kena PPN (jasa luar negeri, dsb).
- `discount` per-item (jumlah, bukan persen) — diskon item-level di luar diskon invoice-level.
- `order` integer — urutan tampilan saat editing.

### `Payment`
- `amount` ≤ `invoice.balanceDue`. Validasi dilakukan di service.
- Penghapusan payment akan **recalculate** invoice → status mungkin balik dari PAID ke PARTIAL/SENT.

### `InvoiceActivity`
Timeline lengkap setiap event di invoice. Bisa direplay untuk audit. `actorId` null = aksi sistem (mis. cron mark-overdue).

### `Notification`
Per-user notification feed. Index `userId + readAt` untuk efisien query "unread count".

### `AuditLog`
- Tidak punya FK relation ke resource (resource bisa terhapus). Field `resource` adalah string `"invoice:abc123"`.
- Retention: 1 tahun (pruning via cron).

### `ApiKey`
- `keyHash` adalah SHA-256 dari raw key. Raw key tidak disimpan (irreversible).
- `prefix` 8 char pertama dari raw key — untuk identifikasi UI ("ifk_a1b2****").

### `RateLimit`
Untuk fallback in-memory rate limit (dev). Production gunakan Upstash Redis langsung.

---

## Index Strategy

Index ditambahkan **berdasarkan query pattern**, bukan asumsi. Berikut justifikasi tiap index:

### `User`
- `@@index([email])` — login lookup.
- `@@index([role])` — admin query.

### `Account` (NextAuth)
- `@@unique([provider, providerAccountId])` — OAuth lookup.
- `@@index([userId])` — fetch all accounts of user.

### `Session`
- `@@index([userId])` — invalidasi session.
- `@@index([expires])` — cleanup expired session via cron.

### `Client`
- `@@unique([userId, email])` — prevent duplicate per user.
- `@@index([userId, isActive])` — list active clients (default UI filter).
- `@@index([userId, deletedAt])` — query non-deleted.
- `@@index([name])` — search by name (LIKE).

### `Invoice`
- `@@unique([userId, invoiceNumber])` — penomoran unik per user.
- `@@index([userId, status])` — filter status (paling sering).
- `@@index([userId, dueDate])` — sort & filter due date.
- `@@index([userId, issueDate])` — date range filter.
- `@@index([clientId])` — list invoice per client.
- `@@index([status, dueDate])` — cron mark-overdue (`WHERE status IN (...) AND dueDate < now`).
- `@@index([deletedAt])` — global soft-delete filter.

### `InvoiceItem`
- `@@index([invoiceId])` — load items for invoice.

### `Payment`
- `@@index([invoiceId])` — load payments for invoice.
- `@@index([userId, date])` — laporan per periode.
- `@@index([method])` — analytics distribusi metode.

### `Notification`
- `@@index([userId, readAt])` — count unread.
- `@@index([userId, createdAt])` — list terbaru.

### `AuditLog`
- `@@index([userId, createdAt])` — log per user.
- `@@index([action])` — filter event type.
- `@@index([resource])` — log per resource.

### `RateLimit`
- `@@unique([key])` — lookup.
- `@@index([resetAt])` — cleanup expired.

### Postgres-specific (post-migration)

Setelah migrasi ke Postgres, tambahkan:

```sql
-- Full-text search untuk Client & Invoice
CREATE INDEX clients_search_idx ON "Client"
  USING gin(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(company,'') || ' ' || coalesce(email,'')));

CREATE INDEX invoices_search_idx ON "Invoice"
  USING gin(to_tsvector('simple', coalesce("invoiceNumber",'') || ' ' || coalesce(notes,'')));

-- Partial index: hanya invoice non-deleted (mempercepat list utama)
CREATE INDEX invoices_active_user_idx ON "Invoice" ("userId", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- Trigram index untuk LIKE/ILIKE search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX clients_name_trgm_idx ON "Client" USING gin (name gin_trgm_ops);
```

---

## Soft Delete Strategy

Tabel berikut memakai `deletedAt`:
- `Client`
- `Invoice`
- `Payment`

**Rule:**
- Semua query default **harus** menyertakan `WHERE deletedAt IS NULL`.
- Helper di `lib/prisma.ts` (Prisma extension) yang otomatis menambahkan filter ini.
- Endpoint admin/debug bisa override dengan flag explicit.
- Hard delete dilakukan periodik (90 hari setelah soft delete) via cron.

Contoh extension:

```ts
// src/lib/prisma.ts (excerpt)
const softDeleteExtension = Prisma.defineExtension({
  query: {
    invoice: {
      async findMany({ args, query }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
    },
    // ... untuk client, payment
  },
});
```

---

## Money & Decimal Handling

**Masalah:** JavaScript `Number` adalah double-precision float — tidak akurat untuk uang (`0.1 + 0.2 !== 0.3`).

**Solusi:**
1. Di **service layer**, semua perhitungan uang menggunakan `Decimal.js`:
   ```ts
   import { Decimal } from "decimal.js";
   const subtotal = items.reduce((acc, it) => acc.plus(new Decimal(it.unitPrice).times(it.quantity)), new Decimal(0));
   ```
2. Di **database**, di SQLite tipe `Float`. Setelah migrasi ke Postgres, **ganti ke `Decimal(18, 2)`**.
3. Di **API**, kirim sebagai `number` (rupiah penuh, bukan sen). Konversi dilakukan di response transformer.
4. Di **PDF & UI**, format dengan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.

Untuk currency dengan minor unit (USD), kita simpan dalam unit utama (dollar), bukan cent. Konsisten lintas currency.

---

## Migration Plan

### Development workflow

```bash
# Buat migration baru
pnpm prisma migrate dev --name add_recurring_fields

# Reset (hati-hati, hapus semua data)
pnpm prisma migrate reset

# Jalankan seed
pnpm prisma db seed
```

### Production migration

Hanya pakai `prisma migrate deploy` (idempotent, tidak generate baru):

```bash
DATABASE_URL=$PROD_DB pnpm prisma migrate deploy
```

### Switch SQLite → PostgreSQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Hapus folder `prisma/migrations/` (yang awalnya untuk SQLite).
3. Jalankan: `pnpm prisma migrate dev --name init_postgres`.
4. Jalankan SQL tambahan (full-text, trigram, partial index — lihat section Index).
5. Migrate data lama (jika ada) via export/import:
   ```bash
   pnpm tsx scripts/export-sqlite.ts > data.json
   pnpm tsx scripts/import-postgres.ts < data.json
   ```

### Migration naming convention
`YYYYMMDDHHMMSS_short_description`. Contoh:
- `20260301120000_initial_schema`
- `20260315093000_add_invoice_public_token`
- `20260401080000_add_recurring_invoice_fields`

### Migration checklist (per migration)

- [ ] Reversible? Hindari `DROP COLUMN` tanpa renaming dulu di release sebelumnya.
- [ ] Index baru → cek size & lock (di Postgres pakai `CREATE INDEX CONCURRENTLY`).
- [ ] Default value → backfill data existing.
- [ ] NOT NULL constraint → harus disertai default atau migration multi-step (add nullable → backfill → set NOT NULL).
- [ ] Test di staging dengan data production-like.

---

## Seed Data

File `prisma/seed.ts` menyiapkan data demo untuk development.

### Struktur seed

```ts
// 1. Demo user
const demoUser = await prisma.user.create({
  data: {
    name: "Budi Santoso",
    email: "demo@invoiceforge.id",
    password: await bcrypt.hash("Demo1234!", 12),
    role: "USER",
  },
});

// 2. Company
await prisma.company.create({
  data: { userId: demoUser.id, name: "Budi Design Studio", currency: "IDR", taxRate: 11, ... },
});

// 3. Clients (10 dummy)
const clients = await Promise.all([
  prisma.client.create({ data: { userId, name: "PT ABC Sejahtera", email: "...", ... } }),
  // ...
]);

// 4. Invoices (50 dummy: berbagai status & tanggal)
for (let i = 1; i <= 50; i++) {
  const status = pickRandom(["DRAFT", "SENT", "PAID", "OVERDUE"]);
  const issueDate = subDays(new Date(), randomInt(0, 180));
  const items = generateRandomItems(randomInt(1, 5));
  // ... compute totals
  await prisma.invoice.create({ data: { ... } });
}

// 5. Payments (untuk invoice PAID/PARTIAL)
// 6. Activities (auto generated)
// 7. Notifications (5 unread)
```

### Quantitative seed targets

| Entity | Jumlah |
|--------|--------|
| User | 1 (demo) + 1 admin |
| Company | 1 |
| Client | 10 |
| Invoice | 50 (mix status & tanggal) |
| InvoiceItem | ~150 (3 avg per invoice) |
| Payment | ~30 |
| Notification | 5 unread + 10 read |

### Seed deterministic

Gunakan `faker` dengan seed tetap (`faker.seed(42)`) agar reproducible.

---

## Query Optimization

### Anti-patterns yang dihindari

1. **N+1 queries** — selalu pakai `include` atau `select` untuk eager load. Contoh:
   ```ts
   // BAD
   const invoices = await prisma.invoice.findMany();
   for (const inv of invoices) {
     inv.client = await prisma.client.findUnique({ where: { id: inv.clientId } });
   }

   // GOOD
   const invoices = await prisma.invoice.findMany({
     include: { client: true, items: true },
   });
   ```

2. **Over-fetching** — pakai `select` untuk field yang dibutuhkan saja, terutama di list endpoint.

3. **`take: undefined`** — selalu set limit/take. Default API `perPage=20`, max `100`.

### Aggregation queries (analytics)

Gunakan `prisma.$queryRaw` untuk query agregat kompleks (lebih cepat dari Prisma `groupBy` di kasus tertentu):

```ts
const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
  SELECT
    strftime('%Y-%m', "issueDate") AS month,
    SUM("paidAmount") AS revenue
  FROM "Invoice"
  WHERE "userId" = ${userId}
    AND "status" = 'PAID'
    AND "deletedAt" IS NULL
    AND "issueDate" >= ${rangeStart}
  GROUP BY month
  ORDER BY month ASC
`;
```

> **Note Postgres:** ganti `strftime` dengan `to_char("issueDate", 'YYYY-MM')`.

### Index hit verification

Saat development, gunakan `EXPLAIN QUERY PLAN` (SQLite) atau `EXPLAIN ANALYZE` (Postgres) untuk verifikasi index dipakai:

```sql
EXPLAIN QUERY PLAN
SELECT * FROM Invoice WHERE userId = ? AND status = 'OVERDUE';
-- Should show: USING INDEX Invoice_userId_status_idx
```

### Connection pool tuning

Untuk Postgres production:

```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

- `connection_limit=20` — sesuaikan dengan instance (Vercel = 1 per function).
- Untuk Vercel/serverless gunakan **PgBouncer** (transaction pooling) dengan `connection_limit=1` di Prisma.

### Pagination strategy

- Offset-based (`page`, `perPage`) — UI standar.
- Cursor-based (`cursor`, `limit`) — list besar (≥ 1000 row) atau infinite scroll.

---

## Backup & Recovery

### Strategi backup
| Tier | Frekuensi | Retention | Storage |
|------|-----------|-----------|---------|
| Continuous WAL (Postgres) | streaming | 7 hari | S3 |
| Logical dump (`pg_dump`) | harian 02:00 WIB | 30 hari | S3 (bucket berbeda) |
| Snapshot bulanan | tiap awal bulan | 1 tahun | Glacier |

### Recovery objectives
- **RPO** (Recovery Point Objective): ≤ 5 menit (WAL streaming).
- **RTO** (Recovery Time Objective): ≤ 1 jam (restore dari logical dump).

### Backup script (contoh)

```bash
# scripts/backup.sh
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump $DATABASE_URL --format=custom --compress=9 \
  --file=/tmp/invoiceforge-$TIMESTAMP.dump
aws s3 cp /tmp/invoiceforge-$TIMESTAMP.dump s3://invoiceforge-backups/daily/
rm /tmp/invoiceforge-$TIMESTAMP.dump
```

### Restore drill
Lakukan **bulanan**: restore backup ke staging environment, jalankan smoke test, verifikasi count rows match.

---

## Multi-Tenancy

InvoiceForge adalah **single-tenant per user** (setiap user adalah tenant tersendiri). Isolasi diperkuat di:

1. **Database level** — semua query MUST include `userId` filter. Lindungi dengan helper:
   ```ts
   // src/lib/db-scope.ts
   export function scopedToUser<T extends { userId: string }>(userId: string, where: any = {}): any {
     return { ...where, userId };
   }
   ```
2. **Middleware** — Next.js middleware menolak request tanpa session.
3. **API Route Handler** — di setiap handler, pertama dapatkan `userId` dari session, lalu inject ke query.
4. **Audit log** — setiap akses cross-user terblock di-log.

Future: jika ada user enterprise dengan multiple companies, tambahkan layer `Organization` (1 user → N organization → N invoices).
