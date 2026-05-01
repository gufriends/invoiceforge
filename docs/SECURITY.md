# InvoiceForge — Security Documentation

Dokumen ini menjelaskan **threat model**, kontrol keamanan, dan praktik baik yang harus diterapkan di seluruh codebase.

> Setiap PR yang menyentuh autentikasi, otorisasi, atau input boundary **wajib** dirujuk ke dokumen ini.

---

## Daftar Isi
1. [Threat Model](#threat-model)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Input Validation](#input-validation)
5. [Output Sanitization](#output-sanitization)
6. [Rate Limiting](#rate-limiting)
7. [CSRF Protection](#csrf-protection)
8. [Session Management](#session-management)
9. [Password Policy](#password-policy)
10. [Secrets Management](#secrets-management)
11. [Data Encryption](#data-encryption)
12. [Audit Logging](#audit-logging)
13. [Dependency Security](#dependency-security)
14. [Security Headers](#security-headers)
15. [File Upload Security](#file-upload-security)
16. [Incident Response](#incident-response)

---

## Threat Model

### Aset bernilai tinggi
- Data finansial user (revenue, invoice, payment).
- Data klien user (PII: email, telepon, NPWP, alamat).
- Kredensial user (password hash, session token, API key).
- Data perusahaan user (NPWP, rekening bank).

### Aktor ancaman
| Aktor | Kemampuan | Motivasi |
|-------|-----------|----------|
| Anonymous attacker | Akses publik (login, register, public invoice) | Account takeover, spam, scraping |
| Authenticated user | Akses ke akunnya | Privilege escalation lewat IDOR |
| Insider | Akses database / kode | Data exfiltration |
| External service compromise | Resend, S3, GitHub | Supply chain |

### Top risiko (OWASP Top 10 2021)
1. **A01 Broken Access Control** — IDOR, missing `userId` filter
2. **A02 Cryptographic Failures** — password hashing, secret rotation
3. **A03 Injection** — SQL, XSS, command
4. **A04 Insecure Design** — business logic abuse (negative payment, modify PAID invoice)
5. **A05 Security Misconfig** — CORS, headers, default credentials
6. **A07 Auth Failures** — brute force, weak password reset
7. **A08 Software & Data Integrity** — supply chain, signed cookies
8. **A09 Logging & Monitoring Failures**
9. **A10 SSRF** — webhooks, image URL preview

---

## Authentication

### Skema
- **Primary:** Credentials (email + password) via NextAuth.js v5 dengan custom credentials provider.
- **OAuth:** Google, GitHub (opsional, dapat diaktifkan via env).
- **API Key:** untuk integrasi (M2M).

### Flow login (credentials)

```
┌────────┐     POST /api/auth/callback/credentials   ┌─────────────┐
│ Client │ ──────────────────────────────────────► │ NextAuth     │
│ (form) │                                            │ (auth.ts)    │
└────────┘                                            └─────┬────────┘
                                                            │ verify
                                                            ▼
                                                      ┌──────────┐
                                                      │ Prisma   │
                                                      │ User     │
                                                      └────┬─────┘
                                                           │ bcrypt.compare
                                                           ▼
                                       OK ─► issue session token (JWT)
                                       FAIL ─► increment failedLoginCount
                                              ─► if ≥ 5: lockedUntil = now + 15m
```

**Implementasi (`src/lib/auth.ts`):**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(credentials, req) {
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !user.password) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new AuthError("Akun terkunci, coba lagi setelah 15 menit");
        }
        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) {
          await handleFailedLogin(user.id);
          return null;
        }
        await handleSuccessfulLogin(user.id, req);
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    // Google, GitHub providers (kondisional dari env)
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
```

### Brute-force protection
- 5 percobaan gagal beruntun → akun lock 15 menit.
- Reset `failedLoginCount` setelah berhasil login.
- Rate-limit per IP: 5 attempts / menit (Upstash).
- Audit log setiap percobaan gagal.

### Password reset
- Token `crypto.randomBytes(32).toString("hex")` (raw).
- Disimpan sebagai hash SHA-256 di DB (`PasswordReset.token`).
- Expiry: 1 jam.
- Single-use (`usedAt` set saat dipakai, ditolak jika sudah ada nilai).
- Email pakai HTTPS link saja.
- **Enumeration prevention:** API selalu mengembalikan 200 sukses, tidak peduli email ada/tidak.

### OAuth
- State parameter untuk CSRF (NextAuth handle otomatis).
- Pin client secret di env, rotate setiap 90 hari.
- Validasi `email_verified=true` untuk Google.

### API Key
- Format: `ifk_<8-prefix>_<32-secret>` (40 char).
- Disimpan sebagai SHA-256 hash di DB.
- Scope-based: `invoices:read`, dst.
- TTL opsional (`expiresAt`).
- Revocation: set `revokedAt`. Verifikasi reject jika non-null.

---

## Authorization

### Model
**RBAC (Role-Based Access Control) + Resource Ownership.**

#### Roles
- `USER` — default, akses ke resource miliknya saja.
- `ADMIN` — akses internal dashboard (impersonate, support, audit).
- `SUPER_ADMIN` — akses semua, termasuk role management.

#### Resource Ownership
Setiap resource (`Invoice`, `Client`, `Payment`, `Company`) memiliki `userId`. Query **harus** difilter berdasarkan `session.user.id`.

### Helper
```ts
// src/lib/auth/require.ts
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError(401, "UNAUTHORIZED", "Sesi tidak valid");
  return session.user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (!hasRole(user.role, role)) {
    throw new ApiError(403, "FORBIDDEN", "Akses ditolak");
  }
  return user;
}

// Verifikasi resource milik user
export async function requireOwnership<T extends { userId: string }>(
  resource: T | null,
  userId: string
): Promise<T> {
  if (!resource) throw new ApiError(404, "NOT_FOUND", "Resource tidak ditemukan");
  if (resource.userId !== userId) {
    // Penting: log ini, tapi balikan 404 (jangan beda dari "tidak ada")
    auditLog({ action: "access.unauthorized", resource: resource.userId, attemptedBy: userId });
    throw new ApiError(404, "NOT_FOUND", "Resource tidak ditemukan");
  }
  return resource;
}
```

### IDOR protection rule
Setiap endpoint yang mengakses resource by ID **wajib**:
1. Ambil `userId` dari session.
2. Query `findUnique({ where: { id, userId } })` (composite filter).
3. Atau load + `requireOwnership`.

**ANTI-PATTERN:**
```ts
// SALAH — tidak filter userId
const invoice = await prisma.invoice.findUnique({ where: { id } });
```

**BENAR:**
```ts
const invoice = await prisma.invoice.findFirst({ where: { id, userId, deletedAt: null } });
if (!invoice) throw new ApiError(404, "NOT_FOUND", "...");
```

### Public token authorization
Endpoint `GET /api/public/invoices/:token` menggunakan `publicToken` invoice (random nanoid 32 char). Token ini:
- **Tidak bisa di-bruteforce** (entropy ≥ 128 bit).
- **Tidak ada timing attack** (pakai `crypto.timingSafeEqual` saat compare).
- **Bisa dirotasi** lewat `POST /api/invoices/:id/rotate-public-token`.

---

## Input Validation

### Zod everywhere
Semua input external (body, query, params, headers) divalidasi via Zod.

**Helper:**
```ts
// src/lib/validation/parse.ts
export async function parseBody<T extends z.ZodSchema>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Body bukan JSON valid");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Validasi gagal", formatZodError(result.error));
  }
  return result.data;
}

export function parseQuery<T extends z.ZodSchema>(url: URL, schema: T): z.infer<T> {
  const obj = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) throw new ApiError(400, "VALIDATION_ERROR", "Query invalid", formatZodError(result.error));
  return result.data;
}
```

### Schema centralization
Semua skema di `src/lib/validations/`:

```ts
// src/lib/validations/invoice.ts
export const createInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  invoiceNumber: z.string().min(1).max(50).optional(),
  issueDate: z.string().date(),
  dueDate: z.string().date(),
  currency: z.enum(["IDR", "USD", "SGD", "MYR", "EUR"]).default("IDR"),
  items: z.array(invoiceItemSchema).min(1).max(100),
  // ...
}).refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  { message: "Tanggal jatuh tempo harus setelah tanggal terbit", path: ["dueDate"] }
);
```

### Common rules
| Field | Rule |
|-------|------|
| Email | `z.string().email().toLowerCase().trim()` |
| Phone (ID) | `/^(\+62|0)\d{8,13}$/` |
| NPWP | `/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/` (lama) atau 16 digit (baru) |
| Currency | enum |
| Hex color | `/^#([0-9A-F]{6})$/i` |
| URL | `z.string().url()` |
| Date | `z.string().date()` (ISO 8601) |
| ID | `z.string().cuid()` |
| Money | `z.number().nonnegative().max(1e15)` |
| Tags | `z.array(z.string().min(2).max(30)).max(10)` |
| String text | `.trim().max(N)` — **selalu** max length |

### Numeric overflow
- Max amount per item: 1e15 IDR (cukup untuk realistic value).
- Max total per invoice: 1e16 IDR.
- Reject `Infinity`, `NaN`, negative (unless allowed).

---

## Output Sanitization

### Mencegah XSS
- React **escape default** (string interpolation aman).
- **Hindari `dangerouslySetInnerHTML`** kecuali konten dari source terpercaya yang sudah disanitasi via `DOMPurify`.
- Field free-text user (`notes`, `terms`, `description`) ditampilkan sebagai text, **tidak** parsing HTML/markdown di MVP.
- Untuk markdown future: pakai `react-markdown` + `rehype-sanitize`.

### Mencegah CSV injection
Saat export CSV, prefix value yang diawali `=`, `+`, `-`, `@` dengan `'`:

```ts
function escapeCsvCell(value: string): string {
  if (/^[=+\-@]/.test(value)) return `'${value}`;
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
```

### PDF safe
`@react-pdf/renderer` menerima `<Text>` dan otomatis escape. **Jangan** inject HTML.

### Email template
Pakai react-email atau Handlebars dengan `{{variable}}` (auto-escape). **Tidak** boleh raw `{{{variable}}}`.

---

## Rate Limiting

### Provider
- **Production:** Upstash Redis + `@upstash/ratelimit`.
- **Development:** in-memory (cukup untuk single instance).

### Implementation

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

export const limits = {
  auth: redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m") }) : memoryLimiter(5, 60_000),
  api: redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "1 m") }) : memoryLimiter(120, 60_000),
  publicView: redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m") }) : memoryLimiter(20, 60_000),
};

export async function enforceLimit(key: string, limiter: Ratelimit) {
  const { success, limit, remaining, reset } = await limiter.limit(key);
  if (!success) {
    throw new ApiError(429, "RATE_LIMITED", "Terlalu banyak permintaan, coba lagi nanti", undefined, { limit, remaining, reset });
  }
}
```

### Middleware

```ts
// src/middleware.ts (excerpt)
export async function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/auth/")) {
    await enforceLimit(`auth:${ip}`, limits.auth);
  } else if (path.startsWith("/api/public/")) {
    await enforceLimit(`public:${ip}`, limits.publicView);
  } else if (path.startsWith("/api/")) {
    const session = await auth();
    const key = session?.user?.id ? `user:${session.user.id}` : `ip:${ip}`;
    await enforceLimit(key, limits.api);
  }
}
```

### Response headers
Setiap response API menyertakan:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: <unix-ts>
```

---

## CSRF Protection

### Strategi
- **Same-Site Cookies** (Lax) — default NextAuth.
- **Custom header** untuk POST/PUT/DELETE: cek header `x-csrf-token` cocok dengan token di session.
- API key requests **bypass CSRF** (M2M, tidak ada cookie).

### Implementation

```ts
// src/lib/csrf.ts
import { randomBytes, timingSafeEqual } from "crypto";

export function issueCsrfToken(sessionId: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(sessionId).digest("hex");
}

export function verifyCsrfToken(req: Request, sessionId: string): boolean {
  const provided = req.headers.get("x-csrf-token");
  if (!provided) return false;
  const expected = issueCsrfToken(sessionId);
  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
```

### Auto-include
TanStack Query default fetcher membaca token dari `<meta name="csrf-token">` (di-render server side) dan inject ke header.

---

## Session Management

### Storage
- **JWT-based** (NextAuth strategy `jwt`). Kombinasi minimum:
  - Pros: stateless, scalable.
  - Cons: tidak ada server-side revoke instan.
- Untuk revoke instan (mis. saat user disable), tambahkan check `User.disabledAt` di setiap request.

### Cookie config
| Property | Value |
|----------|-------|
| `name` | `__Secure-authjs.session-token` (production) |
| `httpOnly` | `true` |
| `secure` | `true` (production) |
| `sameSite` | `lax` |
| `path` | `/` |
| `maxAge` | 30 hari |

### Idle timeout
- Aktivitas reset session expiry setiap request (rolling).
- Inactivity > 30 hari → logout.

### Logout
- Invalidate cookie (set expired).
- Optional: blacklist JWT id sampai `exp` (Redis set + middleware check).

---

## Password Policy

### Rules
- Minimum 8 karakter.
- Harus mengandung ≥ 1 huruf, ≥ 1 angka, ≥ 1 simbol non-alfanumerik.
- Tidak boleh sama persis dengan email atau nama.
- Cek terhadap **HaveIBeenPwned** API (k-anonymity, 5-char prefix) untuk reject password yang sudah breach. *(future enhancement)*

### Hashing
- **bcrypt** dengan cost 12 (`BCRYPT_ROUNDS=12`).
- Salt otomatis dari bcrypt.
- **Tidak boleh** menyimpan plaintext sekalipun sementara.

```ts
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, user.password);
```

### Change password
- Wajib re-enter password lama.
- Setelah ganti: invalidate semua session lain (`revoke other sessions`).
- Kirim email notifikasi.

---

## Secrets Management

### Environment
- Semua secret di env vars, **bukan** di code.
- `.env.local` ada di `.gitignore`.
- Production: pakai vendor secret manager (Vercel/Doppler/AWS Secrets Manager).

### Secret rotation
| Secret | Frekuensi rotasi | Trigger |
|--------|------------------|---------|
| `AUTH_SECRET` | 90 hari | suspected leak |
| OAuth client secret | 90 hari | provider compromise |
| `RESEND_API_KEY` | 180 hari | suspected leak |
| `S3_*` | 90 hari | suspected leak |
| `DATA_ENCRYPTION_KEY` | tidak rotasi (key derivation versioned) | compromise → re-encrypt all |

### Anti-leak
- Pre-commit hook (gitleaks / trufflehog) di CI.
- Sentry: scrub `Authorization`, `Cookie`, `password`, dll dari payload.
- Logger: blacklist field sensitif.

---

## Data Encryption

### In transit
- HTTPS only (HSTS preload).
- HTTP redirect ke HTTPS.
- TLS 1.3 minimum, TLS 1.2 fallback.
- Certificate via Let's Encrypt (auto-renewal).

### At rest (database)
- Postgres at-rest encryption (vendor managed: AWS RDS, Supabase, Neon).
- Field-level encryption untuk **sangat sensitif**:
  - `Company.npwp`
  - `Company.bankAccount`
  - `Client.npwp`
- Encryption: AES-256-GCM dengan `DATA_ENCRYPTION_KEY` (32 byte hex).

```ts
// src/lib/crypto/field-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY = Buffer.from(process.env.DATA_ENCRYPTION_KEY!, "hex");

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64"); // 12 + 16 + n bytes
}

export function decryptField(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
```

### Backups
- Backup encrypted at rest.
- Akses backup dibatasi ke role tertentu di S3 IAM.

---

## Audit Logging

### Apa yang dilog
- `auth.login.success` / `auth.login.failed` / `auth.logout`
- `auth.password.reset.requested` / `auth.password.reset.completed`
- `auth.password.changed`
- `auth.account.locked`
- `auth.api_key.created` / `auth.api_key.revoked`
- `invoice.created` / `invoice.updated` / `invoice.deleted` / `invoice.sent`
- `client.created` / `client.deleted`
- `company.updated`
- `payment.created` / `payment.deleted`
- `access.unauthorized` (IDOR attempt)
- `data.export` (CSV/PDF download laporan)

### Schema
Tabel `AuditLog` (lihat `prisma/schema.prisma`). Fields: userId, action, resource, ipAddress, userAgent, metadata.

### Retention
- 1 tahun untuk audit log umum.
- 3 tahun untuk auth events (compliance).

### Privacy
- IP di-hash setelah 90 hari (k-anonymized) untuk GDPR.
- Tidak log password atau secret payload.

---

## Dependency Security

### Tools
- **`pnpm audit`** di CI, fail jika `high` atau `critical`.
- **Dependabot / Renovate** untuk auto-PR update.
- **Snyk** atau **GitHub Advanced Security** untuk SCA.

### Update cadence
- Critical / high CVE: dalam 7 hari.
- Medium: bulanan.
- Low: kuartalan.

### Pinning
- Semua dependency pinned (no `^` range untuk security packages).
- `pnpm-lock.yaml` di-commit.
- CI verifikasi `pnpm install --frozen-lockfile`.

---

## Security Headers

Diset di `next.config.ts`. Setiap response (page + API) mendapat:

| Header | Value | Tujuan |
|--------|-------|--------|
| `Content-Security-Policy` | (lihat next.config) | XSS prevention |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused features |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |

### CSP detail

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://*.posthog.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://*.sentry.io https://*.posthog.com wss:;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
report-uri /api/csp-report;
```

> `'unsafe-inline'` di `script-src` diperlukan untuk Next.js inline runtime. Roadmap: pakai `nonce`-based CSP (Next.js 15 mendukung).

---

## File Upload Security

### Endpoint terdampak
- `POST /api/company/logo`
- `POST /api/payments` (attachment)
- (future) Avatar upload

### Validasi
1. **Size limit:** max 5 MB (logo 2 MB).
2. **MIME type whitelist:** `image/png`, `image/jpeg`, `image/webp`, `application/pdf` (untuk attachment).
3. **Magic byte check** — jangan trust extension. Pakai `file-type` library.
4. **Filename sanitization** — pakai UUID baru, hindari path traversal.
5. **Image processing:** re-encode dengan `sharp` (strip EXIF, normalize). Mencegah polyglot file.
6. **Storage isolation:** S3 bucket terpisah dari aset publik. Akses via signed URL.

### Implementation skeleton

```ts
// src/lib/storage/upload.ts
import { fileTypeFromBuffer } from "file-type";

const MAX_SIZES = {
  logo: 2 * 1024 * 1024,
  attachment: 5 * 1024 * 1024,
} as const;

const ALLOWED = {
  logo: ["image/png", "image/jpeg", "image/webp"],
  attachment: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
} as const;

export async function safeUpload(file: File, kind: keyof typeof ALLOWED): Promise<string> {
  if (file.size > MAX_SIZES[kind]) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "File terlalu besar");

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED[kind].includes(type.mime as any)) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Tipe file tidak didukung");
  }

  // Re-encode image untuk strip EXIF & polyglot
  if (kind === "logo") {
    const sharp = (await import("sharp")).default;
    const safe = await sharp(buffer).rotate().resize({ width: 600, withoutEnlargement: true }).png({ quality: 90 }).toBuffer();
    return uploadToS3(safe, `logos/${cuid()}.png`, "image/png");
  }

  return uploadToS3(buffer, `attachments/${cuid()}.${type.ext}`, type.mime);
}
```

### Serving
- Logo: served via CDN public URL.
- Attachment: served via signed URL (presigned, 15-menit TTL).

---

## Incident Response

### Detection
- Sentry alert untuk error spike.
- Audit log alert untuk pola anomali (login fail bursts, bulk export).
- Status page check eksternal (UptimeRobot).

### Severity
| Level | Definisi | Response time |
|-------|----------|---------------|
| SEV-1 | Data breach, full outage | 15 menit |
| SEV-2 | Auth broken, partial outage | 1 jam |
| SEV-3 | Single feature degraded | 4 jam |
| SEV-4 | Cosmetic / non-critical | next business day |

### Playbook (singkat)
1. **Triage** — confirm + classify.
2. **Contain** — disable affected endpoint / rotate keys.
3. **Eradicate** — fix root cause.
4. **Recover** — re-deploy + verify.
5. **Notify** — user/regulator (kalau breach data ≥ ambang batas UU PDP).
6. **Post-mortem** — tulis dalam 1 minggu, no-blame.

### Data breach (UU PDP Indonesia)
- Notifikasi ke Kemenkominfo dalam **3x24 jam** sejak diketahui.
- Notifikasi ke subjek data sesegera mungkin.
- Bekerjasama dengan auditor independen.

---

## Compliance / Regulatory

### Indonesia
- **UU PDP (Pelindungan Data Pribadi) — UU 27/2022:** consent, data minimization, breach notification 3x24h.
- **PMK PPN 11%** — implementasi correct di tax calculation.
- **NPWP** — disimpan terenkripsi.

### International (jika ekspansi)
- GDPR — right to access, right to erasure, data portability.
- SOC 2 Type II — control documentation.

### User rights
- Export semua data user → `/settings/export-data` (JSON dump).
- Hapus akun → soft delete + queue 30 hari permanent delete.

---

## Security Checklist for PR Review

- [ ] Endpoint baru memvalidasi input via Zod.
- [ ] Authorization check di awal handler (`requireUser`/`requireOwnership`).
- [ ] Tidak ada `findUnique({ where: { id } })` tanpa userId filter.
- [ ] Mutasi POST/PUT/DELETE memvalidasi CSRF token (kalau pakai cookie auth).
- [ ] Output tidak meng-include field sensitif yang tidak perlu.
- [ ] File upload: size, MIME, magic byte di-check.
- [ ] Tidak menambah `dangerouslySetInnerHTML`.
- [ ] Tidak nge-log secret / password / token.
- [ ] Test untuk happy path + IDOR attempt.
- [ ] Update `audit log` untuk action yang relevan.
