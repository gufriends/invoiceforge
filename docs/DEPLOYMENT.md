# InvoiceForge — Deployment Guide

Panduan deployment InvoiceForge dari **lokal development**, **staging**, hingga **production**.

---

## Daftar Isi
1. [Environment Strategy](#environment-strategy)
2. [Prasyarat](#prasyarat)
3. [Local Development](#local-development)
4. [Docker Setup](#docker-setup)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Database Migration](#database-migration)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Hosting Options](#hosting-options)
9. [Cron / Scheduled Jobs](#cron--scheduled-jobs)
10. [Monitoring & Logging](#monitoring--logging)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [Rollback Strategy](#rollback-strategy)
13. [Performance Tuning](#performance-tuning)
14. [Production Checklist](#production-checklist)

---

## Environment Strategy

| Env | Tujuan | Database | Domain |
|-----|--------|----------|--------|
| **local** | Development per developer | SQLite file | `localhost:3000` |
| **dev** | Shared dev branch | PostgreSQL (Neon dev) | `dev.invoiceforge.id` |
| **staging** | QA & UAT, mirror prod | PostgreSQL (Neon staging) | `staging.invoiceforge.id` |
| **production** | User-facing | PostgreSQL (Neon prod, multi-AZ) | `app.invoiceforge.id` |

### Branch → Env mapping
- `main` → production (auto-deploy after CI green).
- `staging` → staging (auto-deploy).
- `dev` → dev (auto-deploy).
- `feat/*` → preview deployment per PR.

---

## Prasyarat

### Tools
- **Node.js** ≥ 20.10 LTS.
- **pnpm** ≥ 9.0.
- **Docker** ≥ 24 + Docker Compose v2.
- **Git** ≥ 2.40.
- **Prisma CLI** (otomatis via pnpm).

### Akun & layanan eksternal
| Layanan | Tujuan | Tier dev | Tier prod |
|---------|--------|----------|-----------|
| Vercel / Railway / Fly.io | Hosting | Free | Pro |
| Neon / Supabase / RDS | PostgreSQL | Free | Paid |
| Upstash | Redis (rate limit, cache) | Free | Paid |
| Resend | Email | 3000/bulan | Paid |
| Cloudflare R2 / AWS S3 / MinIO | File storage | — | Paid |
| Sentry | Error tracking | Free | Team |
| GitHub | Source control + CI | Free | Team |
| Cloudflare | DNS, CDN, WAF | Free | Pro |

---

## Local Development

### 1. Clone & install
```bash
git clone https://github.com/invoiceforge/app.git invoiceforge
cd invoiceforge
pnpm install
```

### 2. Setup environment
```bash
cp .env.example .env.local
# Edit .env.local — minimum:
# DATABASE_URL=file:./prisma/dev.db
# AUTH_SECRET=$(openssl rand -base64 32)
```

### 3. Setup database
```bash
pnpm prisma:generate
pnpm prisma:migrate    # apply migration + create dev.db
pnpm prisma:seed       # isi data demo
```

### 4. Run dev server
```bash
pnpm dev
# Buka http://localhost:3000
# Login: demo@invoiceforge.id / Demo1234!
```

### 5. Useful commands
```bash
pnpm prisma:studio     # GUI DB inspector di http://localhost:5555
pnpm test:watch        # Vitest watch
pnpm test:e2e:ui       # Playwright UI mode
pnpm typecheck         # TS check
pnpm lint              # ESLint
pnpm analyze           # Bundle analyzer
```

---

## Docker Setup

### Dockerfile (multi-stage)

`Dockerfile`:
```dockerfile
# syntax=docker/dockerfile:1.7

# ---- Stage 1: deps ----
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---- Stage 2: builder ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN pnpm build

# ---- Stage 3: runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+client* ./node_modules/.pnpm/

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### `.dockerignore`
```
node_modules
.next
.git
.github
docs
test
coverage
playwright-report
.env*
!.env.example
*.log
README.md
```

### docker-compose.yml (dev orchestration)

```yaml
version: "3.9"
services:
  app:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"
    env_file: .env.local
    environment:
      DATABASE_URL: postgresql://invoiceforge:secret@db:5432/invoiceforge
      UPSTASH_REDIS_REST_URL: http://redis:6379
    depends_on:
      db: { condition: service_healthy }
      minio: { condition: service_started }

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: invoiceforge
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: invoiceforge
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoiceforge"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### Build & jalankan
```bash
docker compose up -d           # spin up DB + Redis + MinIO
docker compose build app       # build image app
docker compose run app pnpm prisma migrate deploy
docker compose run app pnpm prisma db seed
docker compose up app
```

---

## Environment Variables Reference

> Daftar lengkap di `.env.example`. Berikut yang **wajib di production**:

### Wajib
| Var | Contoh | Catatan |
|-----|--------|---------|
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_APP_URL` | `https://app.invoiceforge.id` | Tanpa trailing slash |
| `DATABASE_URL` | `postgresql://...?connection_limit=20` | Pakai pgbouncer untuk serverless |
| `DIRECT_URL` | `postgresql://...` | Direct (untuk migrate, bypass pooler) |
| `AUTH_SECRET` | (random 32+ byte base64) | `openssl rand -base64 32` |
| `AUTH_URL` | `https://app.invoiceforge.id` | |
| `RESEND_API_KEY` | `re_...` | |
| `EMAIL_FROM` | `InvoiceForge <noreply@invoiceforge.id>` | Verified sender |
| `S3_ENDPOINT` | `https://r2.cloudflarestorage.com` | |
| `S3_BUCKET` | `invoiceforge-prod` | |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | | |
| `S3_PUBLIC_URL` | `https://cdn.invoiceforge.id` | |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | |
| `UPSTASH_REDIS_REST_TOKEN` | | |
| `CRON_SECRET` | random 64-char | Verifikasi cron endpoint |
| `DATA_ENCRYPTION_KEY` | 32-byte hex | `openssl rand -hex 32` |
| `BCRYPT_ROUNDS` | `12` | |
| `SENTRY_DSN` | `https://...@sentry.io/...` | |

### Direkomendasikan
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — sosial login.
- `NEXT_PUBLIC_POSTHOG_KEY` — analytics.
- `LOG_LEVEL` — `info` (dev: `debug`).

### Validasi env saat startup
File `src/lib/env.ts` menggunakan Zod untuk validasi:

```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  // ...
});

export const env = envSchema.parse(process.env);
```

App **fail-fast** di startup jika env invalid.

---

## Database Migration

### Lokal (development)
```bash
pnpm prisma migrate dev --name <description>
```
Membuat migration baru + apply + regenerate client.

### Production (deploy time)
```bash
pnpm prisma migrate deploy
```
Hanya apply migration yang sudah ada (idempotent), **tidak** generate baru.

### Workflow
1. Developer commit migration baru di branch.
2. PR review → merge ke `staging`.
3. Auto-deploy staging menjalankan `prisma migrate deploy`.
4. QA verifikasi di staging.
5. Merge `staging` → `main`.
6. Production deploy:
   - **Pre-deploy hook:** backup DB.
   - **Deploy step 1:** `prisma migrate deploy` (zero-downtime jika non-breaking).
   - **Deploy step 2:** rolling deploy app instance.

### Zero-downtime migration rules
1. **Add column:** harus nullable atau punya default.
2. **Drop column:** dilakukan dalam 2 release:
   - Release N: code tidak lagi pakai kolom.
   - Release N+1: migration drop kolom.
3. **Rename column:** 3 langkah — add new, dual-write, remove old.
4. **Index:** pakai `CREATE INDEX CONCURRENTLY` (Postgres) untuk avoid lock.
5. **NOT NULL:** add default → backfill → set NOT NULL.

### Backfill scripts
Migrasi data tidak boleh di Prisma migration SQL (terlalu lambat untuk row banyak). Gunakan script terpisah:

```ts
// scripts/migrations/2026-04-30-backfill-balance-due.ts
import { prisma } from "@/lib/prisma";

const BATCH = 1000;
let processed = 0;
while (true) {
  const rows = await prisma.invoice.findMany({
    where: { balanceDue: null },
    take: BATCH,
    select: { id: true, total: true, paidAmount: true },
  });
  if (rows.length === 0) break;
  await Promise.all(rows.map(r => prisma.invoice.update({
    where: { id: r.id },
    data: { balanceDue: r.total - r.paidAmount },
  })));
  processed += rows.length;
  console.log(`Processed ${processed}`);
}
```

Jalankan: `pnpm tsx scripts/migrations/2026-04-30-backfill-balance-due.ts`.

---

## CI/CD Pipeline

### GitHub Actions

`.github/workflows/ci.yml` — test (lihat `docs/TESTING.md`).

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main, staging, dev]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Determine env
        id: env
        run: |
          case "${{ github.ref_name }}" in
            main) echo "env=production" >> $GITHUB_OUTPUT ;;
            staging) echo "env=staging" >> $GITHUB_OUTPUT ;;
            dev) echo "env=dev" >> $GITHUB_OUTPUT ;;
          esac

      - name: Backup DB (production only)
        if: steps.env.outputs.env == 'production'
        run: ./scripts/backup-prod-db.sh
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
          BACKUP_S3_BUCKET: ${{ secrets.BACKUP_S3_BUCKET }}

      - name: Run DB migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', steps.env.outputs.env)] }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

      - name: Run smoke test
        run: pnpm tsx scripts/smoke-test.ts
        env:
          BASE_URL: ${{ secrets[format('{0}_BASE_URL', steps.env.outputs.env)] }}

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Branch protection (main)
- Required: CI pass, ≥ 1 reviewer, signed commits, up-to-date branch.
- Restrict force push.
- Auto-delete branch after merge.

---

## Hosting Options

### Option A: Vercel (recommended untuk MVP)

**Pros**
- Zero-config Next.js deployment.
- Edge network global.
- Preview deployments per PR.
- Vercel Cron built-in.

**Cons**
- Vendor lock-in.
- Function execution limit (10s hobby, 60s pro).

**Setup**
1. Connect repo di Vercel dashboard.
2. Set env vars di Project Settings.
3. Push ke `main` → auto-deploy.

**Postgres pooling:** wajib pakai PgBouncer (Neon punya built-in). Set `DATABASE_URL` ke pooler endpoint, `DIRECT_URL` ke direct.

### Option B: Self-host (Docker on VPS)

Cocok untuk full control / data sovereignty.

**Stack**
- Ubuntu 22.04 / Debian 12.
- Docker + Compose.
- Caddy / Traefik untuk reverse proxy + auto TLS.
- Cloudflare di depan untuk DDoS + CDN.

**Caddyfile**
```
app.invoiceforge.id {
  reverse_proxy app:3000
  encode gzip zstd
  header {
    Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    X-Frame-Options "DENY"
    X-Content-Type-Options "nosniff"
  }
}
```

**Process management**
- Docker restart policy: `unless-stopped`.
- systemd unit untuk `docker compose up`.

### Option C: Kubernetes (skala lanjut)

Saat traffic > 5000 RPM, pertimbangkan K8s:
- Helm chart custom.
- Horizontal Pod Autoscaler.
- Ingress (NGINX) + cert-manager.
- External-DNS.

---

## Cron / Scheduled Jobs

### Daftar job
| Job | Cron | Endpoint |
|-----|------|----------|
| Mark overdue invoices | `5 0 * * *` (00:05 WIB) | `POST /api/cron/mark-overdue` |
| Send overdue reminders | `0 2 * * *` (09:00 WIB) | `POST /api/cron/send-reminders` |
| Generate recurring invoices | `0 * * * *` (tiap jam) | `POST /api/cron/recurring-invoices` |
| Cleanup expired tokens | `0 17 * * *` (00:00 WIB) | `POST /api/cron/cleanup-tokens` |
| Backup database | `0 19 * * *` (02:00 WIB) | `scripts/backup.sh` (di GitHub Actions / OS cron) |

### Vercel Cron
`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/mark-overdue", "schedule": "5 17 * * *" },
    { "path": "/api/cron/send-reminders", "schedule": "0 2 * * *" },
    { "path": "/api/cron/recurring-invoices", "schedule": "0 * * * *" },
    { "path": "/api/cron/cleanup-tokens", "schedule": "0 17 * * *" }
  ]
}
```

> Catatan: Vercel cron jalan dalam UTC. Konversi: 00:05 WIB = 17:05 UTC.

### Auth
Endpoint cron memvalidasi `Authorization: Bearer ${CRON_SECRET}`.

```ts
// src/app/api/cron/mark-overdue/route.ts
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await invoiceService.markOverdue();
  return Response.json({ ok: true, count: result.count });
}
```

### Self-hosted alternative
Pakai cron OS atau k8s CronJob:
```cron
5 0 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://app.invoiceforge.id/api/cron/mark-overdue
```

---

## Monitoring & Logging

### Error tracking — Sentry
Setup di `src/lib/sentry.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Strip sensitive data
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
```

**Alerting:**
- Spike error 5xx > 10/menit → page on-call.
- New issue di production → Slack #alerts.

### Logging — Pino
Structured JSON logs.

```ts
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password"],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});
```

**Pengiriman:**
- Vercel: ke Vercel Logs / Datadog forwarder.
- Self-host: Promtail → Loki → Grafana.

### Application metrics
Track via custom metrics:
- `invoice.created.total` (counter).
- `invoice.send.duration_ms` (histogram).
- `payment.created.total` per method (counter dengan label).
- `auth.login.failed.total` (counter, alert spike).

Implementation: pakai `@opentelemetry/api` + exporter (Datadog / Grafana).

### Uptime monitoring
- UptimeRobot / Better Uptime / Pingdom.
- Cek: `GET /api/health` setiap 1 menit.
- Alert: 2x consecutive failure → SMS/PagerDuty.

### `/api/health` endpoint
```ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      ok: true,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      uptime: process.uptime(),
      db: "ok",
    });
  } catch (err) {
    return Response.json({ ok: false, db: "error" }, { status: 503 });
  }
}
```

---

## Backup & Disaster Recovery

### Backup strategy
| Tier | Frekuensi | Retention | Storage | Encryption |
|------|-----------|-----------|---------|------------|
| Logical dump (`pg_dump`) | Harian 02:00 WIB | 30 hari | S3 (region berbeda) | SSE-S3 + GPG |
| Snapshot bulanan | 1 bulan sekali | 1 tahun | S3 Glacier | SSE-KMS |
| WAL streaming (Postgres) | Streaming | 7 hari | S3 | SSE-S3 |
| File storage backup | Harian (incremental) | 30 hari | S3 cross-region | SSE-S3 |

### Backup script
`scripts/backup.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="/tmp/invoiceforge-${TIMESTAMP}.dump"

pg_dump "$DATABASE_URL" \
  --format=custom --compress=9 --no-owner --no-privileges \
  --file="$BACKUP_FILE"

gpg --batch --yes --passphrase "$BACKUP_GPG_PASSPHRASE" \
  --symmetric --cipher-algo AES256 "$BACKUP_FILE"

aws s3 cp "${BACKUP_FILE}.gpg" \
  "s3://${BACKUP_S3_BUCKET}/daily/" \
  --storage-class STANDARD_IA

rm "$BACKUP_FILE" "${BACKUP_FILE}.gpg"
```

### Restore drill (bulanan)
1. Spin up Postgres staging clean.
2. Download backup terakhir.
3. `gpg --decrypt` + `pg_restore`.
4. Verify row counts match expected.
5. Run smoke test pointing app ke staging restored.

### RPO / RTO
- **RPO** (Recovery Point Objective): ≤ 5 menit (WAL streaming).
- **RTO** (Recovery Time Objective): ≤ 1 jam.

---

## Rollback Strategy

### Code rollback
- Vercel: 1-click rollback ke deployment sebelumnya.
- Self-host: tag git `release-vN.M.K`, pull tag, rebuild image.

### Database rollback
- **Aturan:** schema change harus **forward-compatible**. Rollback code tidak boleh breaking schema baru.
- Jika harus rollback schema:
  - Restore dari backup (acceptable downtime).
  - Atau jalankan reverse migration manual.

### Feature flag rollback
- Wrap fitur baru dengan flag (`FEATURE_X=true|false`).
- Disable flag tanpa redeploy.

### Sample rollback playbook
1. Detect issue (Sentry / monitoring alert).
2. Triage severity.
3. Decision (rollback vs hotfix forward).
4. Rollback:
   - `vercel rollback <deployment-id>`.
   - Atau `git revert <commit>` + push → CI deploy.
5. Verify.
6. Post-mortem.

---

## Performance Tuning

### Production
- Enable Prisma Accelerate atau pgbouncer pooling.
- Enable Vercel Edge Cache untuk static.
- Image: pakai Cloudflare Images / Vercel Image Optimization.
- Bundle: tree-shake `lucide-react` (sudah di-config di next.config).

### Database
- Connection pool 20 untuk single instance, 5 untuk per serverless function (with pgbouncer).
- Periodic `VACUUM ANALYZE` (Postgres auto-vacuum, monitor).
- Slow query log threshold 1 detik.

### Caching layer
- Redis (Upstash) untuk:
  - Rate limit counters.
  - Session blacklist.
  - Computed analytics (TTL 5 menit).
  - Public invoice view (TTL 1 menit).

### Cold start mitigation
- Vercel: Edge Runtime untuk `/api/health`, `/api/public/*` (kalau memungkinkan).
- Schedule warmer cron tiap 5 menit untuk endpoint kritis.

---

## Production Checklist

Sebelum go-live, semua centang:

### Security
- [ ] `AUTH_SECRET` random 32+ byte.
- [ ] HTTPS enforced (HSTS preload).
- [ ] CSP active (bukan report-only).
- [ ] Rate limit aktif via Upstash.
- [ ] Audit log aktif.
- [ ] Sensitive field (NPWP, bank) terenkripsi.
- [ ] `DATA_ENCRYPTION_KEY` rotated dari default.
- [ ] Dependencies tanpa CVE high/critical.
- [ ] OWASP ZAP scan run, no high finding.

### Database
- [ ] Postgres 16, multi-AZ atau replica.
- [ ] Connection pooling (pgbouncer) configured.
- [ ] Backup harian + monthly snapshot.
- [ ] Backup restore drill sukses.
- [ ] Slow query log enabled.

### Monitoring
- [ ] Sentry receiving errors.
- [ ] Logs flowing ke central system.
- [ ] Uptime check aktif (3 region).
- [ ] On-call rotation set up.
- [ ] Alerting Slack/PagerDuty teruji.

### Performance
- [ ] Lighthouse mobile ≥ 90.
- [ ] First Contentful Paint < 1.5s.
- [ ] Time to Interactive < 3s.
- [ ] Bundle size first-load < 350 KB gz.
- [ ] CDN aktif untuk static assets.

### Operations
- [ ] Deployment pipeline tested (blue-green / preview).
- [ ] Rollback procedure documented + tested.
- [ ] Cron jobs configured & verified running.
- [ ] DNS TTL ≤ 300 detik untuk fast failover.
- [ ] SSL certificate auto-renewal (Let's Encrypt / Cloudflare).
- [ ] Email delivery tested (SPF, DKIM, DMARC).

### Compliance
- [ ] Privacy policy live.
- [ ] Terms of service live.
- [ ] User data export endpoint working.
- [ ] User account deletion endpoint working.
- [ ] UU PDP compliance review done.

### User-facing
- [ ] Demo account untuk public trial.
- [ ] Status page (status.invoiceforge.id).
- [ ] Email support (support@invoiceforge.id).
- [ ] Documentation portal.

---

## Cost Estimate (per bulan, awal)

Estimasi infrastructure cost untuk 100 user aktif:

| Item | Vendor | Tier | Biaya |
|------|--------|------|-------|
| Hosting | Vercel | Pro | $20 |
| PostgreSQL | Neon | Scale | $20 |
| Redis | Upstash | Pay-as-go | $5 |
| Email | Resend | Pro 50k | $20 |
| File storage | Cloudflare R2 | 10 GB | $1.5 |
| Error tracking | Sentry | Team | $26 |
| CDN | Cloudflare | Free | $0 |
| Domain | — | — | $1 |
| **Total** | | | **~$93/bulan** |

Skala 1000 user: ~$300/bulan.
Skala 10.000 user: ~$2000/bulan.
