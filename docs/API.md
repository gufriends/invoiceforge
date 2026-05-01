# InvoiceForge — API Documentation

Dokumen ini adalah **kontrak resmi** seluruh API InvoiceForge. Setiap endpoint mendefinisikan: schema request/response, validasi, error, contoh nyata, dan caching headers.

> Semua endpoint API berada di bawah prefix `/api`.

---

## Daftar Isi
1. [Konvensi Umum](#konvensi-umum)
2. [Autentikasi](#autentikasi)
3. [Format Response](#format-response)
4. [Error Codes](#error-codes)
5. [Pagination, Filter, Sort](#pagination-filter-sort)
6. [Rate Limiting](#rate-limiting)
7. [Endpoints — Auth](#auth-endpoints)
8. [Endpoints — Company](#company-endpoints)
9. [Endpoints — Clients](#clients-endpoints)
10. [Endpoints — Invoices](#invoices-endpoints)
11. [Endpoints — Payments](#payments-endpoints)
12. [Endpoints — Analytics](#analytics-endpoints)
13. [Endpoints — Reports](#reports-endpoints)
14. [Endpoints — Notifications](#notifications-endpoints)
15. [Endpoints — Public](#public-endpoints)
16. [Endpoints — Cron](#cron-endpoints)
17. [Webhooks](#webhooks)

---

## Konvensi Umum

| Aspek | Aturan |
|-------|--------|
| Base URL | `https://app.invoiceforge.id/api` (prod), `http://localhost:3000/api` (dev) |
| Format | JSON (`Content-Type: application/json`) |
| Encoding | UTF-8 |
| Timezone | ISO 8601 dengan timezone offset (`2026-04-30T10:00:00+07:00`) |
| ID format | CUID — `c8w3xq...` (24+ char) |
| Currency | Disimpan dalam unit utama (rupiah penuh, bukan sen). Tipe `number`. |
| Locale | Field `Accept-Language` header (`id-ID`, `en-US`) |
| Versioning | API saat ini v1. Breaking change → buat path baru `/api/v2/...` |

### Headers Wajib

| Header | Nilai | Wajib? |
|--------|-------|--------|
| `Content-Type` | `application/json` | Ya untuk POST/PUT/PATCH |
| `Accept` | `application/json` | Direkomendasikan |
| `Cookie` | session NextAuth | Ya untuk endpoint privat |
| `X-CSRF-Token` | Token CSRF (untuk POST/PUT/DELETE non-API key) | Ya |
| `Authorization` | `Bearer <api_key>` | Alternatif autentikasi (tanpa session) |
| `Idempotency-Key` | UUID v4 (max 64 char) | Direkomendasikan untuk POST yang membuat resource |

---

## Autentikasi

InvoiceForge mendukung dua mekanisme autentikasi:

### 1. Session Cookie (default — UI)
- Login via `/api/auth/[...nextauth]` (NextAuth.js v5)
- Cookie: `authjs.session-token` (HTTPOnly, Secure, SameSite=Lax)
- Berlaku 30 hari, refresh otomatis jika last activity < 7 hari

### 2. API Key (integrasi pihak ketiga)
- Format header: `Authorization: Bearer ifk_<prefix>_<secret>`
- Dibuat via `POST /api/settings/api-keys`
- Hanya prefix yang ditampilkan setelah pembuatan; raw key tidak bisa diambil ulang
- Scopes: `invoices:read`, `invoices:write`, `clients:read`, `clients:write`, `payments:write`, `analytics:read`

---

## Format Response

### Success (single resource)
```json
{
  "ok": true,
  "data": { "...resource..." },
  "meta": { "timestamp": "2026-04-30T10:00:00+07:00" }
}
```

### Success (list)
```json
{
  "ok": true,
  "data": [ { "..." }, { "..." } ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 142,
    "totalPages": 8,
    "hasMore": true,
    "timestamp": "2026-04-30T10:00:00+07:00"
  }
}
```

### Error
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email tidak valid",
    "details": [
      { "path": "email", "message": "Format email tidak valid" }
    ],
    "requestId": "req_a8b3c1d2"
  }
}
```

### TypeScript Types

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiPaginated<T> = {
  ok: true;
  data: T[];
  meta: ApiMeta & {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type ApiError = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Array<{ path: string; message: string }>;
    requestId: string;
  };
};

export type ApiMeta = {
  timestamp: string;
  requestId?: string;
};
```

---

## Error Codes

| HTTP | Code | Deskripsi |
|------|------|-----------|
| 400 | `VALIDATION_ERROR` | Body / query gagal validasi Zod |
| 400 | `BAD_REQUEST` | Permintaan tidak valid (logika bisnis) |
| 401 | `UNAUTHORIZED` | Belum login / session expired |
| 401 | `INVALID_API_KEY` | API key invalid / dicabut |
| 403 | `FORBIDDEN` | Login tapi tidak punya akses ke resource |
| 403 | `INSUFFICIENT_SCOPE` | API key tidak memiliki scope yang diperlukan |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Konflik state (mis. invoice number duplikat) |
| 410 | `GONE` | Resource sudah dihapus permanen |
| 422 | `BUSINESS_RULE_VIOLATION` | Pelanggaran aturan bisnis (mis. paidAmount > total) |
| 429 | `RATE_LIMITED` | Melewati rate limit |
| 500 | `INTERNAL_ERROR` | Bug server (dilog ke Sentry) |
| 502 | `UPSTREAM_ERROR` | External service (Resend, S3) gagal |
| 503 | `SERVICE_UNAVAILABLE` | Maintenance |

### Format Validation Detail

Validation error selalu menyertakan array `details`:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "path": "items.0.quantity", "message": "Harus lebih dari 0" },
      { "path": "dueDate", "message": "Tanggal jatuh tempo harus setelah tanggal terbit" }
    ],
    "requestId": "req_8f2a"
  }
}
```

---

## Pagination, Filter, Sort

### Pagination
- Query: `?page=1&perPage=20`
- Default `perPage=20`, max `100`
- Page 1-indexed

### Sorting
- Query: `?sort=field:asc` atau `?sort=field:desc`
- Multi sort: `?sort=status:asc,issueDate:desc`

### Filtering
- Equality: `?status=PAID`
- Multiple: `?status=PAID,SENT` (treat sebagai OR)
- Range: `?dueDate.gte=2026-01-01&dueDate.lte=2026-12-31`
- Search: `?q=jakarta` (full-text di field tertentu, lihat per-endpoint)

### Cursor Pagination (untuk list besar)
Beberapa endpoint mendukung cursor:
- Request: `?cursor=<id>&limit=50`
- Response meta: `{ nextCursor: "abc123" }` atau `null` jika habis

---

## Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| `/api/auth/login` | 5 attempts | 1 menit per IP |
| `/api/auth/register` | 3 attempts | 1 jam per IP |
| `/api/auth/forgot-password` | 3 attempts | 1 jam per email |
| `/api/invoices/*` (POST/PUT/DELETE) | 60 req | 1 menit per user |
| `/api/invoices/:id/send` | 10 req | 1 jam per user |
| `/api/public/*` | 20 req | 1 menit per IP |
| Default authenticated | 120 req | 1 menit per user |

### Response Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714465200
Retry-After: 30   # hanya saat 429
```

---

## Auth Endpoints

### `POST /api/auth/register`
Mendaftarkan user baru + membuat `Company` default.

**Body**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "RahasiaKuat123!",
  "companyName": "Budi Design Studio"
}
```

**Validasi (Zod)**
| Field | Aturan |
|-------|--------|
| `name` | string, min 2, max 100 |
| `email` | string, email valid, unique |
| `password` | min 8 char, harus ada huruf + angka + 1 simbol |
| `companyName` | min 2, max 100 |

**Response 201**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "c8w3xq...",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "role": "USER",
      "createdAt": "2026-04-30T03:00:00.000Z"
    }
  }
}
```

**Errors**
- `409 CONFLICT` jika email sudah terdaftar
- `400 VALIDATION_ERROR` jika password lemah

---

### `POST /api/auth/login`
Sebenarnya ditangani NextAuth via `/api/auth/callback/credentials`. Endpoint custom ini wrapper untuk menyederhanakan UI.

**Body**
```json
{ "email": "budi@example.com", "password": "RahasiaKuat123!" }
```

**Response 200** — Set cookie `authjs.session-token`
```json
{
  "ok": true,
  "data": {
    "user": { "id": "c8w...", "name": "Budi", "email": "budi@example.com" },
    "expiresAt": "2026-05-30T03:00:00.000Z"
  }
}
```

**Errors**
- `401 UNAUTHORIZED` — kombinasi salah (jangan bedakan email/password tidak ada)
- `423 LOCKED` — akun terkunci karena 5 percobaan gagal (15 menit)

---

### `POST /api/auth/forgot-password`
**Body**
```json
{ "email": "budi@example.com" }
```

**Response 200** (selalu sukses untuk mencegah enumeration)
```json
{ "ok": true, "data": { "message": "Jika email terdaftar, link reset telah dikirim." } }
```

---

### `POST /api/auth/reset-password`
**Body**
```json
{ "token": "raw_token_dari_email", "password": "BaruRahasia123!" }
```

**Response 200**
```json
{ "ok": true, "data": { "message": "Password berhasil direset." } }
```

**Errors**
- `400` token invalid / expired (1 jam)
- `400` password tidak memenuhi kriteria

---

### `POST /api/auth/logout`
Menghapus session cookie. Mendukung redirect: `?callbackUrl=/login`.

**Response 200**
```json
{ "ok": true, "data": { "message": "Logout berhasil." } }
```

---

### `GET /api/auth/me`
Return user yang sedang login + company.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "c8w3xq",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "image": null,
      "role": "USER",
      "locale": "id-ID",
      "company": { "id": "c9aa...", "name": "Budi Design Studio", "currency": "IDR" }
    }
  }
}
```

---

## Company Endpoints

### `GET /api/company`
Mendapat profil perusahaan user yang sedang login.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "id": "c9aa...",
    "name": "Budi Design Studio",
    "legalName": "PT Budi Kreatif Mandiri",
    "logo": "https://cdn.../logo.png",
    "address": "Jl. Sudirman No. 1",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "10220",
    "country": "Indonesia",
    "phone": "+62 812 3456 7890",
    "email": "halo@budistudio.id",
    "website": "https://budistudio.id",
    "npwp": "01.234.567.8-901.234",
    "isPkp": true,
    "bankName": "BCA",
    "bankAccount": "1234567890",
    "bankHolder": "Budi Santoso",
    "bankBranch": "KCP Sudirman",
    "invoicePrefix": "INV",
    "invoiceTemplate": "MODERN",
    "primaryColor": "#2563EB",
    "currency": "IDR",
    "taxRate": 11,
    "paymentTerms": 30,
    "defaultNotes": "Terima kasih atas kepercayaan Anda.",
    "defaultTerms": "Pembayaran dilakukan via transfer bank.",
    "emailNotifications": true,
    "overdueReminders": true,
    "paymentConfirmations": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-30T00:00:00.000Z"
  }
}
```

---

### `PUT /api/company`
Update company. Partial update supported.

**Body** — semua field optional, hanya yang dikirim akan di-update:
```json
{
  "name": "Budi Design Studio",
  "primaryColor": "#16A34A",
  "taxRate": 11,
  "paymentTerms": 14
}
```

**Validasi penting**
- `npwp`: regex `/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/` (NPWP lama) atau 16 digit (NPWP baru)
- `primaryColor`: hex valid `/^#([0-9A-F]{6})$/i`
- `taxRate`: 0–100
- `paymentTerms`: 0–365

**Response 200** — return company terupdate.

---

### `POST /api/company/logo`
Upload logo. Multipart form-data.

**Form fields**
- `file`: image (max 2 MB, allowed: png, jpeg, webp)

**Response 200**
```json
{
  "ok": true,
  "data": {
    "logo": "https://cdn.invoiceforge.id/logos/c9aa-1714465200.png"
  }
}
```

**Errors**
- `413 PAYLOAD_TOO_LARGE` — file > 2 MB
- `415 UNSUPPORTED_MEDIA_TYPE` — bukan image

---

### `DELETE /api/company/logo`
Menghapus logo dari S3 + null-kan di database.

**Response 200** — `{ "ok": true, "data": { "logo": null } }`

---

## Clients Endpoints

### `GET /api/clients`

**Query params**
| Param | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `page` | number | 1 | Halaman |
| `perPage` | number | 20 | Item per halaman (max 100) |
| `q` | string | — | Search di name, company, email |
| `isActive` | boolean | — | Filter aktif/non-aktif |
| `tag` | string | — | Filter by tag |
| `sort` | string | `createdAt:desc` | Field:direction |

**Contoh request**
```
GET /api/clients?page=1&perPage=20&q=budi&isActive=true&sort=name:asc
```

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": "c1aa...",
      "name": "PT ABC Sejahtera",
      "company": "PT ABC Sejahtera",
      "email": "finance@abc.co.id",
      "phone": "+62 21 1234 5678",
      "address": "Jl. Thamrin No. 10",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "country": "Indonesia",
      "npwp": "01.234.567.8-901.234",
      "isActive": true,
      "stats": {
        "totalInvoices": 12,
        "totalRevenue": 145000000,
        "outstandingAmount": 15000000,
        "lastInvoiceDate": "2026-04-15T00:00:00.000Z"
      },
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 18, "totalPages": 1, "hasMore": false }
}
```

---

### `GET /api/clients/:id`

**Response 200** — return Client lengkap + `stats`.

**Errors** — `404` jika tidak ditemukan / bukan milik user.

---

### `POST /api/clients`

**Body**
```json
{
  "name": "PT ABC Sejahtera",
  "company": "PT ABC Sejahtera",
  "email": "finance@abc.co.id",
  "phone": "+62 21 1234 5678",
  "address": "Jl. Thamrin No. 10",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "10350",
  "country": "Indonesia",
  "npwp": "01.234.567.8-901.234",
  "notes": "VIP client, follow up tiap minggu.",
  "tags": ["enterprise", "tahunan"]
}
```

**Validasi**
| Field | Aturan |
|-------|--------|
| `name` | required, 2–100 char |
| `email` | required, email valid, unique per-user |
| `phone` | optional, regex E.164 / lokal Indonesia (`+62...` atau `08...`) |
| `npwp` | optional, regex NPWP |
| `tags` | optional, array max 10 tag, masing-masing 2–30 char |

**Response 201**
```json
{ "ok": true, "data": { "id": "c1aa...", "name": "PT ABC Sejahtera", "..." } }
```

**Errors**
- `409 CONFLICT` — email sudah ada untuk user ini

---

### `PUT /api/clients/:id`
Partial update. Body sama struktur dengan POST tapi semua optional.

---

### `DELETE /api/clients/:id`
Soft delete (set `deletedAt`).

**Errors**
- `409 CONFLICT` — client masih punya invoice non-DRAFT/CANCELLED. UI harus menampilkan dialog "tidak bisa dihapus, ada invoice aktif".

**Response 200** — `{ "ok": true, "data": { "message": "Client dihapus." } }`

---

### `GET /api/clients/:id/invoices`
Sub-resource: list invoice milik client.

**Query**
- Pagination + filter status

---

### `GET /api/clients/:id/stats`
**Response 200**
```json
{
  "ok": true,
  "data": {
    "totalInvoices": 12,
    "totalRevenue": 145000000,
    "outstandingAmount": 15000000,
    "averageInvoiceValue": 12083333,
    "averagePaymentDays": 18.5,
    "byStatus": {
      "DRAFT": 1, "SENT": 2, "PAID": 8, "OVERDUE": 1, "CANCELLED": 0
    },
    "monthlyRevenue": [
      { "month": "2026-01", "amount": 25000000 },
      { "month": "2026-02", "amount": 30000000 }
    ]
  }
}
```

---

## Invoices Endpoints

### `GET /api/invoices`

**Query**
| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `page`, `perPage`, `sort` | — | Standar |
| `q` | string | Search invoiceNumber, client name, notes |
| `status` | enum csv | `DRAFT,SENT,VIEWED,PARTIAL,PAID,OVERDUE,CANCELLED` |
| `clientId` | cuid | Filter per client |
| `issueDate.gte` | ISO date | |
| `issueDate.lte` | ISO date | |
| `dueDate.gte` / `.lte` | ISO date | |
| `total.gte` / `.lte` | number | |
| `isRecurring` | boolean | |

**Contoh**
```
GET /api/invoices?status=OVERDUE,SENT&dueDate.lte=2026-04-30&sort=dueDate:asc
```

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": "i_8aa1",
      "invoiceNumber": "INV-2026-0024",
      "status": "PAID",
      "client": {
        "id": "c1aa", "name": "PT ABC", "email": "finance@abc.co.id"
      },
      "issueDate": "2026-04-01T00:00:00.000Z",
      "dueDate": "2026-04-30T00:00:00.000Z",
      "total": 13875000,
      "paidAmount": 13875000,
      "balanceDue": 0,
      "currency": "IDR",
      "isRecurring": false,
      "createdAt": "2026-04-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 24, "totalPages": 2, "hasMore": true }
}
```

---

### `GET /api/invoices/:id`
**Response 200** — Invoice lengkap dengan `client`, `items`, `payments`, `activities`.

```json
{
  "ok": true,
  "data": {
    "id": "i_8aa1",
    "invoiceNumber": "INV-2026-0024",
    "status": "PAID",
    "client": { "id": "c1aa", "name": "PT ABC", "email": "finance@abc.co.id", "address": "...", "npwp": "..." },
    "issueDate": "2026-04-01T00:00:00.000Z",
    "dueDate": "2026-04-30T00:00:00.000Z",
    "sentAt": "2026-04-02T08:00:00.000Z",
    "viewedAt": "2026-04-02T14:23:00.000Z",
    "paidAt": "2026-04-15T10:00:00.000Z",
    "currency": "IDR",
    "exchangeRate": 1,
    "items": [
      {
        "id": "ii_1",
        "name": "Web Design",
        "description": "Homepage + 5 halaman",
        "quantity": 1,
        "unit": "paket",
        "unitPrice": 10000000,
        "discount": 0,
        "taxable": true,
        "total": 10000000,
        "order": 0
      },
      {
        "id": "ii_2",
        "name": "SEO Setup",
        "description": null,
        "quantity": 1,
        "unit": "paket",
        "unitPrice": 2500000,
        "discount": 0,
        "taxable": true,
        "total": 2500000,
        "order": 1
      }
    ],
    "subtotal": 12500000,
    "discountType": "PERCENTAGE",
    "discountValue": 0,
    "discountAmount": 0,
    "taxRate": 11,
    "taxAmount": 1375000,
    "shippingAmount": 0,
    "total": 13875000,
    "paidAmount": 13875000,
    "balanceDue": 0,
    "notes": "Terima kasih atas kepercayaan Anda.",
    "terms": "Pembayaran via transfer BCA.",
    "isRecurring": false,
    "template": "MODERN",
    "pdfUrl": "https://cdn.../inv-2026-0024.pdf",
    "publicToken": "tok_kx9...",
    "payments": [
      {
        "id": "p_1",
        "amount": 13875000,
        "method": "BANK_TRANSFER",
        "date": "2026-04-15T00:00:00.000Z",
        "reference": "BCA-1234567",
        "notes": "Transfer dari rek 8801"
      }
    ],
    "activities": [
      { "id": "a_1", "type": "CREATED", "createdAt": "2026-04-01T00:00:00.000Z" },
      { "id": "a_2", "type": "SENT", "createdAt": "2026-04-02T08:00:00.000Z" },
      { "id": "a_3", "type": "VIEWED", "createdAt": "2026-04-02T14:23:00.000Z" },
      { "id": "a_4", "type": "PAYMENT_RECEIVED", "createdAt": "2026-04-15T10:00:00.000Z" },
      { "id": "a_5", "type": "PAID", "createdAt": "2026-04-15T10:00:00.000Z" }
    ],
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-15T10:00:00.000Z"
  }
}
```

---

### `POST /api/invoices`

**Body**
```json
{
  "clientId": "c1aa",
  "invoiceNumber": null,
  "issueDate": "2026-05-01",
  "dueDate": "2026-05-31",
  "currency": "IDR",
  "items": [
    {
      "name": "Web Design",
      "description": "Homepage + 5 halaman",
      "quantity": 1,
      "unit": "paket",
      "unitPrice": 10000000,
      "discount": 0,
      "taxable": true
    }
  ],
  "discountType": "PERCENTAGE",
  "discountValue": 0,
  "taxRate": 11,
  "shippingAmount": 0,
  "notes": "Terima kasih.",
  "terms": "Pembayaran 30 hari.",
  "template": "MODERN",
  "isRecurring": false,
  "recurringCycle": null,
  "recurringEnd": null,
  "status": "DRAFT"
}
```

**Validasi**
| Field | Aturan |
|-------|--------|
| `clientId` | required, harus milik user |
| `invoiceNumber` | optional. Jika null → auto-generate. Jika diisi → unique per user |
| `issueDate` | required, ISO date |
| `dueDate` | required, ≥ `issueDate` |
| `items` | required, min 1 item |
| `items[].name` | required, 1–200 char |
| `items[].quantity` | required, > 0 |
| `items[].unitPrice` | required, ≥ 0 |
| `items[].discount` | 0–100 jika percentage, ≥ 0 jika fixed |
| `discountValue` | sesuai `discountType` |
| `taxRate` | 0–100 |
| `currency` | enum: `IDR`, `USD`, `SGD`, `MYR`, `EUR` |
| `status` | enum, hanya `DRAFT` atau `SENT` saat create |

**Response 201** — Return invoice lengkap (sama format dengan GET detail).

**Side effects**
- Auto-generate `invoiceNumber` jika tidak diisi (format: `{prefix}-{year}-{nnnn}`)
- Auto-compute: `subtotal`, `discountAmount`, `taxAmount`, `total`, `balanceDue`
- Generate `publicToken` (nanoid 32 char)
- Buat `InvoiceActivity { type: CREATED }`
- Jika `status: SENT` → trigger email + buat activity SENT

---

### `PUT /api/invoices/:id`

Update invoice. Constraint:

- Invoice dengan status `PAID`, `CANCELLED` **tidak dapat diedit** kecuali field `notes`.
- Mengubah `items` / `discountValue` / `taxRate` akan **re-calculate totals**.
- `invoiceNumber` boleh diubah tapi harus tetap unique.

**Errors**
- `422 BUSINESS_RULE_VIOLATION` jika mencoba edit invoice PAID.

---

### `DELETE /api/invoices/:id`
Soft delete. Hanya invoice `DRAFT` yang boleh dihapus permanen via `?permanent=true`.

**Errors**
- `422` jika status PAID/PARTIAL — harus dibatalkan dulu.

---

### `POST /api/invoices/:id/send`
Mengirim invoice via email ke client.

**Body** (opsional)
```json
{
  "to": ["finance@abc.co.id"],
  "cc": ["budi@example.com"],
  "subject": "Invoice INV-2026-0024 dari Budi Studio",
  "message": "Halo, terlampir invoice untuk pekerjaan bulan ini.",
  "attachPdf": true
}
```

**Default behavior**
- `to`: `client.email`
- `subject`: `Invoice {invoiceNumber} dari {company.name}`
- `message`: template default
- `attachPdf`: `true`

**Response 200**
```json
{
  "ok": true,
  "data": {
    "id": "i_8aa1",
    "status": "SENT",
    "sentAt": "2026-05-01T08:00:00.000Z",
    "messageId": "resend_msg_abc123"
  }
}
```

**Side effects**
- Generate PDF jika belum ada
- Update status `DRAFT → SENT`
- Buat activity `SENT`
- Buat notification

---

### `POST /api/invoices/:id/duplicate`
Membuat invoice baru berdasarkan invoice ini (status `DRAFT`, tanggal hari ini, nomor baru).

**Response 201** — Invoice baru yang dibuat.

---

### `POST /api/invoices/:id/cancel`
Membatalkan invoice. Boleh untuk status `DRAFT`, `SENT`, `VIEWED`, `OVERDUE`.

**Body** — `{ "reason": "Klien membatalkan project" }`

**Response 200** — Invoice dengan `status: CANCELLED`, `cancelledAt`.

---

### `GET /api/invoices/:id/pdf`
Stream PDF invoice. `Content-Type: application/pdf`.

**Query**
- `?download=true` → header `Content-Disposition: attachment`
- `?regenerate=true` → re-generate PDF (invalidate cache)

**Response 200** — binary PDF.

---

### `GET /api/invoices/stats`
Stats global invoice user.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "totalInvoices": 142,
    "totalRevenue": 1250000000,
    "outstandingAmount": 85000000,
    "overdueAmount": 35000000,
    "byStatus": {
      "DRAFT": 8, "SENT": 15, "VIEWED": 4, "PARTIAL": 2,
      "PAID": 105, "OVERDUE": 6, "CANCELLED": 2
    },
    "thisMonth": {
      "invoices": 12, "revenue": 145000000, "growthPercent": 12.5
    }
  }
}
```

---

### `GET /api/invoices/number/next`
Mendapat invoice number berikutnya tanpa membuat invoice.

**Query**
- `?year=2026` (opsional, default tahun ini)

**Response 200**
```json
{ "ok": true, "data": { "invoiceNumber": "INV-2026-0143" } }
```

---

### `POST /api/invoices/:id/reminder`
Kirim email reminder manual. Rate-limited.

**Response 200** — `{ "ok": true, "data": { "messageId": "..." } }`

---

## Payments Endpoints

### `POST /api/payments`

**Body**
```json
{
  "invoiceId": "i_8aa1",
  "amount": 5000000,
  "method": "BANK_TRANSFER",
  "date": "2026-04-15",
  "reference": "BCA-1234567",
  "notes": "Pembayaran termin 1",
  "attachment": "https://cdn.../bukti.png"
}
```

**Validasi**
| Field | Aturan |
|-------|--------|
| `invoiceId` | required, harus milik user, status bukan CANCELLED |
| `amount` | required, > 0, ≤ `invoice.balanceDue` |
| `method` | required, enum |
| `date` | required, ISO date, tidak boleh masa depan |
| `reference` | optional, max 100 char |

**Response 201** — Payment + invoice ter-update (status mungkin berubah ke `PARTIAL` / `PAID`).

```json
{
  "ok": true,
  "data": {
    "payment": { "id": "p_2", "amount": 5000000, "..." },
    "invoice": { "id": "i_8aa1", "status": "PARTIAL", "paidAmount": 5000000, "balanceDue": 8875000 }
  }
}
```

**Side effects**
- Recalculate `invoice.paidAmount`, `balanceDue`, `status`, `paidAt`
- Aktivitas `PAYMENT_RECEIVED` (+ `PAID` jika lunas)
- Email konfirmasi ke client (jika setting aktif)
- Notification "Pembayaran diterima"

---

### `PUT /api/payments/:id`
Update payment. Hanya editor yang sama (user yang membuat).

---

### `DELETE /api/payments/:id`
Soft delete payment.

**Side effects** — recalculate invoice (mungkin status balik ke SENT/OVERDUE).

---

### `GET /api/payments`
List semua pembayaran user.

**Query**
- `invoiceId`, `clientId`, `method`, `date.gte`, `date.lte`

---

## Analytics Endpoints

### `GET /api/analytics/overview`
**Query** — `?range=30d|90d|365d|ytd|custom&from=&to=`

**Response 200**
```json
{
  "ok": true,
  "data": {
    "range": { "from": "2026-04-01", "to": "2026-04-30" },
    "kpi": {
      "revenue": { "value": 145000000, "change": 0.125, "previousValue": 128888888 },
      "invoicesCount": { "value": 12, "change": 0.20, "previousValue": 10 },
      "clientsCount": { "value": 18, "change": 0.05, "previousValue": 17 },
      "overdueCount": { "value": 3, "change": -0.25, "previousValue": 4 },
      "averagePaymentDays": { "value": 18.5, "change": -2.0 }
    }
  }
}
```

---

### `GET /api/analytics/revenue`
Time series revenue.

**Query**
- `granularity=day|week|month`
- `range=30d|90d|365d|ytd`

**Response 200**
```json
{
  "ok": true,
  "data": {
    "granularity": "month",
    "series": [
      { "period": "2025-11", "revenue": 95000000, "invoices": 8, "paid": 7 },
      { "period": "2025-12", "revenue": 110000000, "invoices": 10, "paid": 9 },
      { "period": "2026-01", "revenue": 125000000, "invoices": 11, "paid": 10 },
      { "period": "2026-02", "revenue": 130000000, "invoices": 11, "paid": 11 },
      { "period": "2026-03", "revenue": 140000000, "invoices": 12, "paid": 11 },
      { "period": "2026-04", "revenue": 145000000, "invoices": 12, "paid": 11 }
    ]
  }
}
```

---

### `GET /api/analytics/clients`
**Response 200**
```json
{
  "ok": true,
  "data": {
    "topClients": [
      { "client": { "id": "c1", "name": "PT ABC" }, "revenue": 45000000, "invoices": 4 },
      { "client": { "id": "c2", "name": "PT XYZ" }, "revenue": 30000000, "invoices": 3 }
    ],
    "newClientsThisMonth": 3,
    "activeClients": 18,
    "churnedClients": 1
  }
}
```

---

### `GET /api/analytics/invoices`
Distribusi status & rata-rata.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "statusDistribution": [
      { "status": "PAID", "count": 105, "amount": 1100000000 },
      { "status": "SENT", "count": 15, "amount": 75000000 },
      { "status": "OVERDUE", "count": 6, "amount": 35000000 }
    ],
    "paymentMethodDistribution": [
      { "method": "BANK_TRANSFER", "count": 80, "amount": 900000000 },
      { "method": "QRIS", "count": 15, "amount": 75000000 },
      { "method": "E_WALLET", "count": 10, "amount": 50000000 }
    ],
    "averageInvoiceValue": 8800000,
    "medianPaymentDays": 12,
    "oldestUnpaid": { "id": "i_x", "invoiceNumber": "INV-2026-0010", "daysOverdue": 45 }
  }
}
```

---

## Reports Endpoints

### `GET /api/reports/income`
**Query** — `range`, `format=json|csv|pdf`

**Response 200 (json)**
```json
{
  "ok": true,
  "data": {
    "range": { "from": "2026-01-01", "to": "2026-04-30" },
    "totalIncome": 540000000,
    "totalTax": 53460000,
    "totalDiscount": 5000000,
    "byMonth": [...],
    "byClient": [...]
  }
}
```

**Response 200 (csv/pdf)** — file stream.

---

### `GET /api/reports/tax`
Laporan PPN per periode.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "period": "2026-Q1",
    "totalTaxable": 360000000,
    "totalTax": 39600000,
    "transactions": [
      {
        "invoiceNumber": "INV-2026-0001",
        "date": "2026-01-05",
        "client": "PT ABC",
        "npwp": "01.234.567.8-901.234",
        "subtotal": 10000000,
        "tax": 1100000,
        "total": 11100000
      }
    ]
  }
}
```

---

### `GET /api/reports/aging`
Accounts Receivable Aging.

**Response 200**
```json
{
  "ok": true,
  "data": {
    "asOf": "2026-04-30",
    "buckets": {
      "current": { "count": 5, "amount": 35000000 },
      "1-30": { "count": 3, "amount": 18000000 },
      "31-60": { "count": 2, "amount": 12000000 },
      "61-90": { "count": 1, "amount": 5000000 },
      "90+": { "count": 1, "amount": 5000000 }
    },
    "byClient": [
      {
        "client": { "id": "c1", "name": "PT ABC" },
        "current": 0, "30": 5000000, "60": 0, "90": 0, "90plus": 0,
        "total": 5000000
      }
    ]
  }
}
```

---

### `GET /api/reports/client-statement/:clientId`
**Query** — `range=ytd&format=pdf`

Return statement of account untuk client tertentu.

---

## Notifications Endpoints

### `GET /api/notifications`
**Query** — `?unreadOnly=true&page=1&perPage=20`

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": "n_1",
      "type": "INVOICE_VIEWED",
      "title": "Invoice dilihat",
      "message": "PT ABC membuka INV-2026-0024",
      "link": "/invoices/i_8aa1",
      "readAt": null,
      "createdAt": "2026-04-30T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 5, "unreadCount": 3 }
}
```

---

### `POST /api/notifications/mark-read`
**Body** — `{ "ids": ["n_1", "n_2"] }` atau `{ "all": true }`

**Response 200** — `{ "ok": true, "data": { "updated": 2 } }`

---

### `DELETE /api/notifications/:id`
Hapus notifikasi.

---

## Public Endpoints

Endpoint ini tidak memerlukan autentikasi. Diakses lewat token publik.

### `GET /api/public/invoices/:token`
View invoice publik (link share).

**Response 200** — Invoice subset (no internal fields):
```json
{
  "ok": true,
  "data": {
    "invoiceNumber": "INV-2026-0024",
    "company": { "name": "Budi Studio", "logo": "...", "address": "..." },
    "client": { "name": "PT ABC", "address": "..." },
    "issueDate": "...",
    "dueDate": "...",
    "items": [...],
    "subtotal": 12500000, "tax": 1375000, "total": 13875000,
    "status": "SENT",
    "balanceDue": 13875000,
    "currency": "IDR"
  }
}
```

**Side effects**
- Update `viewedAt` & status `SENT → VIEWED` (jika belum)
- Buat activity `VIEWED`
- Buat notification untuk pemilik

---

### `GET /api/public/invoices/:token/pdf`
Download PDF publik.

---

## Cron Endpoints

Endpoint internal untuk scheduled tasks. Dilindungi `Authorization: Bearer ${CRON_SECRET}`.

### `POST /api/cron/recurring-invoices`
Generate invoice baru dari recurring template yang `recurringNext ≤ now`.
- Frekuensi: tiap jam
- Side effect: buat invoice + email + notification

---

### `POST /api/cron/mark-overdue`
Update status `SENT/VIEWED/PARTIAL → OVERDUE` jika `dueDate < now`.
- Frekuensi: tiap hari pukul 00:05 WIB

---

### `POST /api/cron/send-reminders`
Kirim reminder email untuk invoice OVERDUE (T+1, T+7, T+14).
- Frekuensi: tiap hari pukul 09:00 WIB

---

### `POST /api/cron/cleanup-tokens`
Hapus password reset & verification token expired.
- Frekuensi: tiap hari

---

## Webhooks

### Outbound (untuk integrasi user, future)
- `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.overdue`
- `payment.received`
- Configure di `/settings/webhooks`
- Payload signed dengan HMAC-SHA256, header `X-InvoiceForge-Signature`

### Inbound
- `POST /api/webhooks/resend` — delivery status email (delivered, bounced, complained)
- `POST /api/webhooks/payment-gateway` (future, untuk auto-mark paid)

---

## Idempotency

Endpoint POST yang membuat resource (`/api/invoices`, `/api/payments`) mendukung header `Idempotency-Key`. Jika request dengan key yang sama dikirim ulang dalam 24 jam, server mengembalikan response yang sama tanpa re-process.

---

## Versioning Strategy

- **Saat ini:** v1 implisit (`/api/...`)
- **Breaking change:** path baru `/api/v2/...`
- **Deprecation policy:** minimum 6 bulan support pada versi lama, header `Deprecation: true` + `Sunset: <date>`
