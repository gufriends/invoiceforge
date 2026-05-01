# InvoiceForge — Phase 1: Foundation

> **PETUNJUK UNTUK DEEPSEEK:** Ikuti urutan EXACT. Setiap step kerjakan sampai selesai sebelum lanjut. Jangan lompat. Jangan improvise. Jika ada konflik, ikuti yang ada di file ini.

---

## Daftar Isi
- [Step 1: Inisialisasi Project](#step-1-inisialisasi-project)
- [Step 2: Install Dependencies](#step-2-install-dependencies)
- [Step 3: Konfigurasi TypeScript & Tailwind](#step-3-konfigurasi-typescript--tailwind)
- [Step 4: Konfigurasi shadcn/ui](#step-4-konfigurasi-shadcnui)
- [Step 5: Environment Variables](#step-5-environment-variables)
- [Step 6: Prisma Setup](#step-6-prisma-setup)
- [Step 7: Buat Types & Constants](#step-7-buat-types--constants)
- [Step 8: NextAuth v5 Setup](#step-8-nextauth-v5-setup)
- [Step 9: Middleware Route Protection](#step-9-middleware-route-protection)
- [Step 10: Utility Functions](#step-10-utility-functions)
- [Step 11: Validation Schemas (Zod)](#step-11-validation-schemas-zod)
- [Step 12: Providers (TanStack Query, Theme)](#step-12-providers-tanstack-query-theme)
- [Step 13: Zustand Stores](#step-13-zustand-stores)
- [Step 14: Layout Components](#step-14-layout-components)
- [Step 15: Auth Pages](#step-15-auth-pages)
- [Step 16: Custom Components Foundation](#step-16-custom-components-foundation)
- [Step 17: Auth API Routes](#step-17-auth-api-routes)
- [Step 18: Verifikasi](#step-18-verifikasi)

---

## Step 1: Inisialisasi Project

- [ ] Buka terminal di `/home/tutud/.openclaw/workspace-upan/invoiceforge/`
- [ ] PROYEK SUDAH ADA struktur foldernya. Cek dulu apakah sudah ada `package.json`. Kalau belum, jalankan:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

- [ ] Ketika ditanya overwrite, pilih `Yes`
- [ ] Pastikan struktur folder: `src/`, `prisma/`, `public/`, `docs/`, `scripts/`, `test/` ada

---

## Step 2: Install Dependencies

- [ ] Jalankan PERSIS command berikut:

```bash
npm install \
  next@latest \
  react@latest \
  react-dom@latest \
  @prisma/client \
  prisma \
  next-auth@beta \
  @auth/prisma-adapter \
  bcryptjs \
  @tanstack/react-query@^5 \
  @tanstack/react-query-devtools@^5 \
  zustand \
  react-hook-form \
  @hookform/resolvers \
  zod \
  recharts \
  @react-pdf/renderer \
  framer-motion \
  lucide-react \
  date-fns \
  clsx \
  tailwind-merge \
  class-variance-authority \
  sonner \
  next-themes
```

- [ ] Install dev dependencies:

```bash
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  @types/bcryptjs \
  typescript \
  tsx \
  tailwindcss@^4 \
  @tailwindcss/postcss@^4 \
  postcss \
  autoprefixer \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  jsdom
```

---

## Step 3: Konfigurasi TypeScript & Tailwind

### File: `tsconfig.json`
- [ ] Replace dengan konten exact:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### File: `postcss.config.mjs`
- [ ] Replace:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### File: `src/app/globals.css`
- [ ] Replace dengan konten exact:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-900: #1e3a8a;

  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-warning-500: #f97316;
  --color-warning-600: #ea580c;
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;
  --color-info-500: #06b6d4;
  --color-info-600: #0891b2;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

:root {
  --background: 248 250 252; /* slate-50 */
  --foreground: 15 23 42; /* slate-900 */
  --card: 255 255 255;
  --card-foreground: 15 23 42;
  --border: 226 232 240; /* slate-200 */
  --input: 226 232 240;
  --ring: 37 99 235; /* primary-600 */
  --primary: 37 99 235;
  --primary-foreground: 255 255 255;
  --secondary: 124 58 237;
  --secondary-foreground: 255 255 255;
  --muted: 241 245 249;
  --muted-foreground: 100 116 139;
  --accent: 241 245 249;
  --accent-foreground: 15 23 42;
  --destructive: 220 38 38;
  --destructive-foreground: 255 255 255;
}

.dark {
  --background: 15 23 42; /* slate-900 */
  --foreground: 241 245 249;
  --card: 30 41 59; /* slate-800 */
  --card-foreground: 241 245 249;
  --border: 51 65 85;
  --input: 51 65 85;
  --ring: 59 130 246;
  --primary: 59 130 246;
  --primary-foreground: 15 23 42;
  --secondary: 139 92 246;
  --secondary-foreground: 15 23 42;
  --muted: 30 41 59;
  --muted-foreground: 148 163 184;
  --accent: 30 41 59;
  --accent-foreground: 241 245 249;
  --destructive: 239 68 68;
  --destructive-foreground: 15 23 42;
}

* {
  border-color: rgb(var(--border));
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### File: `next.config.ts`
- [ ] Replace:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
```

---

## Step 4: Konfigurasi shadcn/ui

- [ ] Inisialisasi shadcn:

```bash
npx shadcn@latest init -d
```

- [ ] Ketika ditanya, pilih:
  - Style: `default`
  - Base color: `slate`
  - CSS variables: `Yes`

- [ ] Install shadcn components dengan command PERSIS berikut:

```bash
npx shadcn@latest add button input label textarea select checkbox switch \
  dialog sheet popover tooltip dropdown-menu \
  card badge avatar separator skeleton \
  table form alert toast sonner \
  tabs calendar command \
  scroll-area progress alert-dialog \
  navigation-menu
```

- [ ] Verifikasi semua component ada di `src/components/ui/`

---

## Step 5: Environment Variables

### File: `.env.example`
- [ ] Buat file di root:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_SECRET="ganti-dengan-string-random-minimal-32-karakter-aman"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend - opsional Phase 1)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@invoiceforge.id"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="InvoiceForge"
```

### File: `.env.local`
- [ ] Buat file di root, copy isi `.env.example`
- [ ] Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

- [ ] Paste hasilnya ke `AUTH_SECRET` di `.env.local`

### File: `.gitignore`
- [ ] Pastikan ada baris-baris ini:

```
node_modules/
.next/
.env*.local
*.db
dev.db
dev.db-journal
.DS_Store
```

---

## Step 6: Prisma Setup

### File: `prisma/schema.prisma`
- [ ] Buat dengan konten EXACT:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  avatar        String?
  emailVerified DateTime?
  company       Company?
  invoices      Invoice[]
  clients       Client[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Company {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  logo            String?
  address         String?
  city            String?
  province        String?
  postalCode      String?
  country         String   @default("Indonesia")
  phone           String?
  email           String?
  website         String?
  npwp            String?
  bankName        String?
  bankAccount     String?
  bankHolder      String?
  invoicePrefix   String   @default("INV")
  invoiceTemplate String   @default("modern")
  primaryColor    String   @default("#2563eb")
  currency        String   @default("IDR")
  taxRate         Float    @default(11.0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Client {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name       String
  email      String
  phone      String?
  company    String?
  address    String?
  city       String?
  province   String?
  postalCode String?
  country    String    @default("Indonesia")
  npwp       String?
  notes      String?
  invoices   Invoice[]
  isActive   Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId])
  @@index([userId, isActive])
}

model Invoice {
  id             String          @id @default(cuid())
  userId         String
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientId       String
  client         Client          @relation(fields: [clientId], references: [id])
  invoiceNumber  String
  status         InvoiceStatus   @default(DRAFT)
  issueDate      DateTime
  dueDate        DateTime
  items          InvoiceItem[]
  subtotal       Float
  taxRate        Float           @default(0)
  taxAmount      Float           @default(0)
  discountType   DiscountType?   @default(PERCENTAGE)
  discountValue  Float           @default(0)
  discountAmount Float           @default(0)
  total          Float
  notes          String?
  terms          String?
  paidAmount     Float           @default(0)
  payments       Payment[]
  isRecurring    Boolean         @default(false)
  recurringCycle RecurringCycle?
  recurringNext  DateTime?
  template       String          @default("modern")
  sentAt         DateTime?
  viewedAt       DateTime?
  pdfUrl         String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@unique([userId, invoiceNumber])
  @@index([userId, status])
  @@index([userId, issueDate])
  @@index([clientId])
}

model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  name        String
  description String?
  quantity    Float    @default(1)
  unitPrice   Float
  total       Float
  order       Int      @default(0)

  @@index([invoiceId])
}

model Payment {
  id        String        @id @default(cuid())
  invoiceId String
  invoice   Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount    Float
  method    PaymentMethod
  date      DateTime
  reference String?
  notes     String?
  createdAt DateTime      @default(now())

  @@index([invoiceId])
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum DiscountType {
  PERCENTAGE
  FIXED
}

enum RecurringCycle {
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

enum PaymentMethod {
  BANK_TRANSFER
  CASH
  E_WALLET
  QRIS
  CHEQUE
  OTHER
}
```

### File: `package.json`
- [ ] Tambahkan/update scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force",
    "test": "vitest"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Run Migration & Seed
- [ ] Jalankan PERSIS:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### File: `src/lib/prisma.ts`
- [ ] Buat:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Buat seed script
- [ ] Salin konten dari `/docs/SEED-DATA.md` ke `prisma/seed.ts`
- [ ] Jalankan:

```bash
npx prisma db seed
```

---

## Step 7: Buat Types & Constants

- [ ] Salin SEMUA file dari `/docs/TYPESCRIPT-TYPES.md` ke lokasi masing-masing:
  - [ ] `src/lib/constants.ts`
  - [ ] `src/types/index.ts`
  - [ ] `src/types/user.ts`
  - [ ] `src/types/company.ts`
  - [ ] `src/types/client.ts`
  - [ ] `src/types/invoice.ts`
  - [ ] `src/types/payment.ts`
  - [ ] `src/types/analytics.ts`
  - [ ] `src/types/api.ts`
  - [ ] `src/types/api-requests.ts`
  - [ ] `src/types/forms.ts`
  - [ ] `src/types/component-props.ts`
  - [ ] `src/types/hooks.ts`
  - [ ] `src/types/utils.ts`
  - [ ] `src/types/store.ts`

---

## Step 8: NextAuth v5 Setup

### File: `src/auth.config.ts`
- [ ] Buat:

```ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Authorize logic ada di src/auth.ts (non-edge)
        // Di sini hanya schema validation
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/forgot-password");
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/invoices") ||
        nextUrl.pathname.startsWith("/clients") ||
        nextUrl.pathname.startsWith("/analytics") ||
        nextUrl.pathname.startsWith("/reports") ||
        nextUrl.pathname.startsWith("/settings");

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
} satisfies NextAuthConfig;
```

### File: `src/auth.ts`
- [ ] Buat:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
});
```

### File: `src/types/next-auth.d.ts`
- [ ] Buat:

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

### File: `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Buat:

```ts
export { GET, POST } from "@/auth";
```

---

## Step 9: Middleware Route Protection

### File: `src/middleware.ts`
- [ ] Buat di root `src/`:

```ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

---

## Step 10: Utility Functions

### File: `src/lib/utils.ts`
- [ ] Buat:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### File: `src/utils/format-currency.ts`
- [ ] Buat:

```ts
import { CURRENCY_LOCALES, CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";

export function formatCurrency(
  value: number,
  currency: Currency = "IDR",
  options?: { compact?: boolean; showSymbol?: boolean }
): string {
  const { compact = false, showSymbol = true } = options || {};
  const locale = CURRENCY_LOCALES[currency];

  if (compact && Math.abs(value) >= 1000) {
    const formatter = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return showSymbol ? `${CURRENCY_SYMBOLS[currency]} ${formatter.format(value)}` : formatter.format(value);
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  });

  if (!showSymbol) return formatter.format(value);

  // Force "Rp " prefix untuk IDR
  if (currency === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  }

  return formatter.format(value);
}

export function parseCurrency(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
```

### File: `src/utils/format-date.ts`
- [ ] Buat:

```ts
import { format, formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";

export function formatDate(
  date: Date | string,
  formatType: "short" | "long" | "numeric" | "monthYear" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  switch (formatType) {
    case "short":
      return format(d, "dd MMM yyyy", { locale: localeID });
    case "long":
      return format(d, "EEEE, dd MMMM yyyy", { locale: localeID });
    case "numeric":
      return format(d, "dd/MM/yyyy", { locale: localeID });
    case "monthYear":
      return format(d, "MMMM yyyy", { locale: localeID });
    default:
      return format(d, "dd MMM yyyy", { locale: localeID });
  }
}

export function formatDateRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: localeID });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: localeID });
}
```

### File: `src/utils/generate-invoice-number.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";

export function generateInvoiceNumber(prefix: string, year: number, sequence: number): string {
  const seq = String(sequence).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

export async function getNextInvoiceNumber(userId: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const yearPattern = `${prefix}-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: { startsWith: yearPattern },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return generateInvoiceNumber(prefix, year, nextSeq);
}
```

### File: `src/utils/calculate-totals.ts`
- [ ] Buat:

```ts
import type { CalculateInvoiceTotalsFn, InvoiceTotals } from "@/types";

export const calculateInvoiceTotals: CalculateInvoiceTotalsFn = ({
  items,
  taxRate,
  discountType,
  discountValue,
}): InvoiceTotals => {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  let discountAmount = 0;
  if (discountType === "PERCENTAGE") {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  if (discountAmount > subtotal) discountAmount = subtotal;

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    taxableAmount: Math.round(taxableAmount),
    taxAmount: Math.round(taxAmount),
    total: Math.round(total),
  };
};
```

### File: `src/utils/export-csv.ts`
- [ ] Buat:

```ts
export function exportCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!data.length) return;

  const cols = headers ?? (Object.keys(data[0]) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }));
  const headerRow = cols.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const v = row[c.key];
        if (v === null || v === undefined) return "";
        return `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Step 11: Validation Schemas (Zod)

### File: `src/lib/validations.ts`
- [ ] Buat:

```ts
import { z } from "zod";
import {
  INVOICE_STATUSES,
  INVOICE_TEMPLATES,
  PAYMENT_METHODS,
  DISCOUNT_TYPES,
  RECURRING_CYCLES,
  CURRENCIES,
} from "@/lib/constants";

// AUTH
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus ada huruf kapital")
      .regex(/[a-z]/, "Password harus ada huruf kecil")
      .regex(/[0-9]/, "Password harus ada angka"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Kamu harus menyetujui syarat & ketentuan" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus ada huruf kapital")
      .regex(/[0-9]/, "Password harus ada angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

// CLIENT
export const clientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().max(20).optional().or(z.literal("")),
  company: z.string().max(150).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  country: z.string().default("Indonesia"),
  npwp: z
    .string()
    .regex(/^(\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3})?$/, "Format NPWP: XX.XXX.XXX.X-XXX.XXX")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// INVOICE ITEM
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama item wajib diisi").max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  order: z.number().int().default(0),
});

// INVOICE
export const invoiceSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Nomor invoice wajib diisi").max(50),
    clientId: z.string().min(1, "Pilih klien terlebih dahulu"),
    issueDate: z.coerce.date({ required_error: "Tanggal terbit wajib diisi" }),
    dueDate: z.coerce.date({ required_error: "Tanggal jatuh tempo wajib diisi" }),
    template: z.enum(INVOICE_TEMPLATES).default("modern"),
    items: z.array(invoiceItemSchema).min(1, "Minimal 1 item"),
    taxRate: z.coerce.number().min(0).max(100).default(11),
    discountType: z.enum(DISCOUNT_TYPES).default("PERCENTAGE"),
    discountValue: z.coerce.number().min(0).default(0),
    notes: z.string().max(1000).optional().or(z.literal("")),
    terms: z.string().max(1000).optional().or(z.literal("")),
    isRecurring: z.boolean().default(false),
    recurringCycle: z.enum(RECURRING_CYCLES).nullable().default(null),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: "Tanggal jatuh tempo harus setelah atau sama dengan tanggal terbit",
    path: ["dueDate"],
  });

// PAYMENT
export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Jumlah pembayaran harus lebih dari 0"),
  method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: "Pilih metode pembayaran" }) }),
  date: z.coerce.date({ required_error: "Tanggal pembayaran wajib diisi" }),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// COMPANY
export const companySchema = z.object({
  name: z.string().min(2, "Nama perusahaan minimal 2 karakter").max(150),
  logo: z.string().optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  country: z.string().default("Indonesia"),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  website: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
  npwp: z.string().optional().or(z.literal("")),
  bankName: z.string().max(100).optional().or(z.literal("")),
  bankAccount: z.string().max(50).optional().or(z.literal("")),
  bankHolder: z.string().max(150).optional().or(z.literal("")),
  invoicePrefix: z.string().min(1).max(10).default("INV"),
  invoiceTemplate: z.enum(INVOICE_TEMPLATES).default("modern"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna #RRGGBB").default("#2563eb"),
  currency: z.enum(CURRENCIES).default("IDR"),
  taxRate: z.coerce.number().min(0).max(100).default(11),
});
```

---

## Step 12: Providers (TanStack Query, Theme)

### File: `src/components/providers/query-provider.tsx`
- [ ] Buat:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 menit
            gcTime: 5 * 60 * 1000, // 5 menit
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

### File: `src/components/providers/theme-provider.tsx`
- [ ] Buat:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}
```

### File: `src/components/providers/index.tsx`
- [ ] Buat:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-sans",
              },
            }}
          />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

### File: `src/app/layout.tsx`
- [ ] Replace dengan:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### File: `src/app/page.tsx`
- [ ] Replace dengan:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  redirect("/login");
}
```

---

## Step 13: Zustand Stores

### File: `src/store/sidebar-store.ts`
- [ ] Buat:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SidebarStore } from "@/types/store";

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    { name: "sidebar-storage", partialize: (s) => ({ collapsed: s.collapsed }) }
  )
);
```

### File: `src/store/notification-store.ts`
- [ ] Buat:

```ts
import { create } from "zustand";
import type { NotificationStore } from "@/types/store";

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) =>
    set((s) => {
      const item = {
        ...n,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        read: false,
      };
      return {
        notifications: [item, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      };
    }),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  remove: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
```

---

## Step 14: Layout Components

### File: `src/components/layouts/sidebar.tsx`
- [ ] Buat. Menu items WAJIB sama persis:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  ChevronLeft,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/reports", label: "Laporan", icon: ClipboardList },
  { href: "/settings", label: "Pengaturan", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r bg-card transition-[width] duration-200 ease-in-out hidden lg:flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Receipt className="h-5 w-5" />
          </div>
          {!collapsed && <span className="text-lg">InvoiceForge</span>}
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### File: `src/components/layouts/topbar.tsx`
- [ ] Buat:

```tsx
"use client";

import { Bell, Moon, Sun, Search, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari invoice, klien..." className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{session?.user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{session?.user?.name}</div>
              <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" /> Profil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### File: `src/components/layouts/auth-layout.tsx`
- [ ] Buat:

```tsx
import { Receipt } from "lucide-react";
import Link from "next/link";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-secondary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Receipt className="h-6 w-6" />
          </div>
          InvoiceForge
        </Link>
        <div>
          <h2 className="text-4xl font-bold mb-4">Invoice Profesional, Bisnis Lebih Cuan.</h2>
          <p className="text-lg text-white/80">
            Platform invoice & client management untuk freelancer & UMKM Indonesia.
          </p>
        </div>
        <div className="text-sm text-white/60">© 2026 InvoiceForge. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2 text-xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Receipt className="h-6 w-6" />
            </div>
            InvoiceForge
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
```

### File: `src/app/(app)/layout.tsx`
- [ ] Buat:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

### File: `src/app/(auth)/layout.tsx`
- [ ] Buat:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <>{children}</>;
}
```

---

## Step 15: Auth Pages

### File: `src/components/forms/login-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";
import type { LoginFormValues } from "@/types/forms";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);

    if (res?.error) {
      toast.error("Email atau password salah");
      return;
    }
    toast.success("Berhasil masuk");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="nama@email.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Lupa password?
          </Link>
        </div>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Masuk
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}
```

### File: `src/app/(auth)/login/page.tsx`
- [ ] Buat:

```tsx
import { AuthLayout } from "@/components/layouts/auth-layout";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Selamat datang kembali" subtitle="Masuk ke akun InvoiceForge kamu">
      <LoginForm />
    </AuthLayout>
  );
}
```

### File: `src/components/forms/register-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { registerSchema } from "@/lib/validations";
import type { RegisterFormValues } from "@/types/forms";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.message ?? "Pendaftaran gagal");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    toast.success("Pendaftaran berhasil");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input id="name" placeholder="Nama kamu" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="nama@email.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Min. 8 karakter" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input id="confirmPassword" type="password" placeholder="Ulangi password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(c) => setValue("acceptTerms", c === true, { shouldValidate: true })}
        />
        <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
          Saya setuju dengan syarat & ketentuan dan kebijakan privasi InvoiceForge
        </Label>
      </div>
      {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Daftar
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
```

### File: `src/app/(auth)/register/page.tsx`
- [ ] Buat:

```tsx
import { AuthLayout } from "@/components/layouts/auth-layout";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Buat akun baru" subtitle="Mulai kelola invoice & klien dengan mudah">
      <RegisterForm />
    </AuthLayout>
  );
}
```

### File: `src/components/forms/forgot-password-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validations";
import type { ForgotPasswordFormValues } from "@/types/forms";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    setSubmitted(true);
    toast.success("Link reset password sudah dikirim ke email kamu");
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Cek email kamu untuk link reset password. Jika tidak menerima dalam 5 menit, cek folder spam.
        </p>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">Kembali ke login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="nama@email.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kirim link reset
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
```

### File: `src/app/(auth)/forgot-password/page.tsx`
- [ ] Buat:

```tsx
import { AuthLayout } from "@/components/layouts/auth-layout";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Lupa password?" subtitle="Masukkan email untuk reset password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
```

---

## Step 16: Custom Components Foundation

### File: `src/components/custom/empty-state.tsx`
- [ ] Buat:

```tsx
import type { EmptyStateProps } from "@/types/component-props";
import { Button } from "@/components/ui/button";

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
```

### File: `src/components/custom/stats-card.tsx`
- [ ] Buat:

```tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsCardProps } from "@/types/component-props";

const variantStyles: Record<NonNullable<StatsCardProps["variant"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-orange-500/10 text-orange-600",
  danger: "bg-red-500/10 text-red-600",
  info: "bg-cyan-500/10 text-cyan-600",
};

export function StatsCard({ title, value, change, changeLabel, icon: Icon, variant = "default", onClick, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn("transition hover:shadow-md", onClick && "cursor-pointer hover:scale-[1.01]")}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {typeof change === "number" && (
              <div className="flex items-center gap-1 text-xs">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### File: `src/components/custom/invoice-status-badge.tsx`
- [ ] Buat:

```tsx
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants";
import type { InvoiceStatusBadgeProps } from "@/types/component-props";

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

export function InvoiceStatusBadge({ status, size = "md" }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium border-0", INVOICE_STATUS_COLORS[status], sizes[size])}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
```

### File: `src/components/custom/currency-input.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CurrencyInputProps } from "@/types/component-props";

export function CurrencyInput({ value, onChange, currency = "IDR", placeholder = "0", disabled, className, id, name }: CurrencyInputProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (value === 0) {
      setDisplay("");
    } else {
      setDisplay(new Intl.NumberFormat("id-ID").format(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/,/g, "").replace(/[^\d]/g, "");
    if (raw === "") {
      setDisplay("");
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    setDisplay(new Intl.NumberFormat("id-ID").format(num));
    onChange(num);
  };

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
        {CURRENCY_SYMBOLS[currency]}
      </span>
      <Input
        id={id}
        name={name}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 font-mono"
        inputMode="numeric"
      />
    </div>
  );
}
```

### File: `src/components/custom/search-input.tsx`
- [ ] Buat:

```tsx
"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9 pr-9" />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
```

### File: `src/components/custom/loading-skeleton.tsx`
- [ ] Buat:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
```

---

## Step 17: Auth API Routes

### File: `src/app/api/auth/register/route.ts`
- [ ] Buat:

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "EMAIL_EXISTS", message: "Email sudah terdaftar" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        company: { create: { name: `${name} Business` } },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e) {
    console.error("REGISTER_ERROR", e);
    return NextResponse.json({ error: "INTERNAL", message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
```

### File: `src/app/api/auth/forgot-password/route.ts`
- [ ] Buat (stub untuk Phase 1, implementasi penuh di Phase 4):

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Email tidak valid" }, { status: 400 });
  }

  // Always return success untuk mencegah email enumeration
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    // TODO Phase 4: kirim email reset link
    console.log(`[FORGOT-PASSWORD] Reset link untuk: ${user.email}`);
  }

  return NextResponse.json({ data: { sent: true } });
}
```

---

## Step 18: Verifikasi

- [ ] Jalankan `npm run dev`
- [ ] Buka http://localhost:3000 → harus redirect ke `/login`
- [ ] Klik "Daftar di sini" → form `/register` muncul
- [ ] Daftar user baru: `test@test.id` / `Password123!`
- [ ] Setelah daftar, harus redirect ke `/dashboard` (akan 404 sementara, OK)
- [ ] Logout via avatar dropdown
- [ ] Login dengan `budi@invoiceforge.id` / `Password123!` (dari seed)
- [ ] Toggle dark mode via topbar → harus berubah
- [ ] Toggle sidebar collapse → harus berubah & persist setelah reload
- [ ] Cek di Prisma Studio (`npm run db:studio`):
  - [ ] 4 user (3 seed + 1 test)
  - [ ] 11 client
  - [ ] 31 invoice

---

## Checklist Akhir Phase 1

- [ ] Project ter-init dengan Next.js 15 + TS + Tailwind 4
- [ ] Semua dependency terinstall
- [ ] Prisma schema match exact dengan dokumen ini
- [ ] Migration sudah jalan, DB ada di `prisma/dev.db`
- [ ] Seed berhasil dengan 3 user, 11 client, 31 invoice, 20 payment
- [ ] All TypeScript types ada di `src/types/` dan `src/lib/constants.ts`
- [ ] NextAuth bekerja (login/logout/register)
- [ ] Middleware proteksi route bekerja
- [ ] Layout (sidebar + topbar) tampil di `(app)` group
- [ ] Auth pages tampil di `(auth)` group
- [ ] Dark mode toggle bekerja
- [ ] Sidebar collapse bekerja & persist
- [ ] Toast notifications muncul
- [ ] Tidak ada error TypeScript (`npm run build` sukses)
- [ ] **SIAP LANJUT KE PHASE 2** ✅
