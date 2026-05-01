# InvoiceForge — Phase 2: Clients + Invoices Core

> **PETUNJUK:** Phase 1 HARUS sudah selesai 100%. Cek checklist akhir Phase 1 dulu.

---

## Daftar Isi
- [Step 1: API Helper Library](#step-1-api-helper-library)
- [Step 2: Service Layer](#step-2-service-layer)
- [Step 3: Client API Routes](#step-3-client-api-routes)
- [Step 4: Client TanStack Query Hooks](#step-4-client-tanstack-query-hooks)
- [Step 5: Client Form](#step-5-client-form)
- [Step 6: Client Pages](#step-6-client-pages)
- [Step 7: Invoice Number Generator API](#step-7-invoice-number-generator-api)
- [Step 8: Invoice API Routes](#step-8-invoice-api-routes)
- [Step 9: Invoice TanStack Query Hooks](#step-9-invoice-tanstack-query-hooks)
- [Step 10: Item Editor Component](#step-10-item-editor-component)
- [Step 11: Client Select Component](#step-11-client-select-component)
- [Step 12: Invoice Form](#step-12-invoice-form)
- [Step 13: Invoice Pages](#step-13-invoice-pages)
- [Step 14: Verifikasi](#step-14-verifikasi)

---

## Step 1: API Helper Library

### File: `src/lib/api-utils.ts`
- [ ] Buat:

```ts
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { auth } from "@/auth";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number = 400, public details?: unknown) {
    super(message);
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("UNAUTHORIZED", "Kamu harus login terlebih dahulu", 401);
  }
  return session.user.id;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Data tidak valid", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  console.error("API_ERROR", error);
  return NextResponse.json({ error: "INTERNAL", message: "Terjadi kesalahan server" }, { status: 500 });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function parseQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.parse(obj);
}

export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

### File: `src/lib/api-client.ts`
- [ ] Buat (untuk client-side fetch):

```ts
const API_BASE = "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? "Terjadi kesalahan");
  }
  return json.data as T;
}

export async function apiFetchPaginated<T>(path: string): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? "Terjadi kesalahan");
  return json;
}

export function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
```

---

## Step 2: Service Layer

### File: `src/services/client.service.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { CreateClientRequest, UpdateClientRequest } from "@/types/api-requests";

export const clientService = {
  async list(userId: string, opts: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const { page, limit, search, isActive, sortBy = "createdAt", sortOrder = "desc" } = opts;

    const where = {
      userId,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { company: { contains: search } },
            ],
          }
        : {}),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy === "totalRevenue" ? undefined : { [sortBy]: sortOrder },
        include: {
          _count: { select: { invoices: true } },
          invoices: {
            select: { total: true, paidAmount: true, status: true, createdAt: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const enriched = clients.map((c) => {
      const totalRevenue = c.invoices.reduce(
        (sum, inv) => (inv.status === "PAID" || inv.status === "PARTIAL" ? sum + inv.paidAmount : sum),
        0
      );
      const outstandingAmount = c.invoices.reduce(
        (sum, inv) => (inv.status !== "CANCELLED" ? sum + (inv.total - inv.paidAmount) : sum),
        0
      );
      const lastInvoiceDate = c.invoices.reduce<Date | null>(
        (latest, inv) => (!latest || inv.createdAt > latest ? inv.createdAt : latest),
        null
      );
      const { invoices, _count, ...rest } = c;
      return {
        ...rest,
        totalInvoices: _count.invoices,
        totalRevenue,
        outstandingAmount,
        lastInvoiceDate,
      };
    });

    if (sortBy === "totalRevenue") {
      enriched.sort((a, b) => (sortOrder === "asc" ? a.totalRevenue - b.totalRevenue : b.totalRevenue - a.totalRevenue));
    }

    return { data: enriched, total };
  },

  async getById(userId: string, id: string) {
    const client = await prisma.client.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          select: { total: true, paidAmount: true, status: true, createdAt: true },
        },
      },
    });
    if (!client) throw new ApiError("NOT_FOUND", "Klien tidak ditemukan", 404);

    const totalRevenue = client.invoices.reduce(
      (sum, inv) => (inv.status === "PAID" || inv.status === "PARTIAL" ? sum + inv.paidAmount : sum),
      0
    );
    const outstandingAmount = client.invoices.reduce(
      (sum, inv) => (inv.status !== "CANCELLED" ? sum + (inv.total - inv.paidAmount) : sum),
      0
    );
    const lastInvoiceDate = client.invoices.reduce<Date | null>(
      (latest, inv) => (!latest || inv.createdAt > latest ? inv.createdAt : latest),
      null
    );

    const { invoices, _count, ...rest } = client;
    return {
      ...rest,
      totalInvoices: _count.invoices,
      totalRevenue,
      outstandingAmount,
      lastInvoiceDate,
    };
  },

  async create(userId: string, data: CreateClientRequest) {
    return prisma.client.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postalCode: data.postalCode || null,
        country: data.country || "Indonesia",
        npwp: data.npwp || null,
        notes: data.notes || null,
        isActive: true,
      },
    });
  },

  async update(userId: string, id: string, data: UpdateClientRequest) {
    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError("NOT_FOUND", "Klien tidak ditemukan", 404);

    return prisma.client.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.company !== undefined ? { company: data.company || null } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.city !== undefined ? { city: data.city || null } : {}),
        ...(data.province !== undefined ? { province: data.province || null } : {}),
        ...(data.postalCode !== undefined ? { postalCode: data.postalCode || null } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.npwp !== undefined ? { npwp: data.npwp || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.client.findFirst({
      where: { id, userId },
      include: { _count: { select: { invoices: true } } },
    });
    if (!existing) throw new ApiError("NOT_FOUND", "Klien tidak ditemukan", 404);
    if (existing._count.invoices > 0) {
      throw new ApiError(
        "HAS_INVOICES",
        "Klien tidak bisa dihapus karena masih punya invoice. Nonaktifkan saja klien ini.",
        400
      );
    }
    await prisma.client.delete({ where: { id } });
  },

  async getInvoices(userId: string, clientId: string) {
    const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
    if (!client) throw new ApiError("NOT_FOUND", "Klien tidak ditemukan", 404);

    return prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
        client: { select: { id: true, name: true, company: true, email: true } },
      },
    });
  },
};
```

### File: `src/services/invoice.service.ts`
- [ ] Buat:

```ts
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { calculateInvoiceTotals } from "@/utils/calculate-totals";
import { getNextInvoiceNumber } from "@/utils/generate-invoice-number";
import type { CreateInvoiceRequest, UpdateInvoiceRequest } from "@/types/api-requests";

export const invoiceService = {
  async list(userId: string, opts: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const { page, limit, search, status, clientId, startDate, endDate, sortBy = "createdAt", sortOrder = "desc" } = opts;

    const where: any = {
      userId,
      ...(status && status !== "ALL" ? { status } : {}),
      ...(clientId ? { clientId } : {}),
      ...(startDate || endDate
        ? {
            issueDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { client: { name: { contains: search } } },
              { client: { company: { contains: search } } },
            ],
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: { select: { id: true, name: true, company: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => {
        const { _count, ...rest } = inv;
        return { ...rest, itemCount: _count.items };
      }),
      total,
    };
  },

  async getById(userId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
        payments: { orderBy: { date: "desc" } },
      },
    });
    if (!invoice) throw new ApiError("NOT_FOUND", "Invoice tidak ditemukan", 404);
    return invoice;
  },

  async getStats(userId: string) {
    const [counts, sums, overdueAgg] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: ["PAID", "PARTIAL"] } },
        _sum: { paidAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: "OVERDUE" },
        _sum: { total: true, paidAmount: true },
        _count: { _all: true },
      }),
    ]);

    const findCount = (s: string) => counts.find((c) => c.status === s)?._count?._all ?? 0;
    const total = counts.reduce((sum, c) => sum + (c._count?._all ?? 0), 0);
    const overdueAmount = (overdueAgg._sum?.total ?? 0) - (overdueAgg._sum?.paidAmount ?? 0);
    const totalRevenue = sums._sum?.paidAmount ?? 0;
    const outstanding = await prisma.invoice.aggregate({
      where: { userId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      _sum: { total: true, paidAmount: true },
    });
    const outstandingAmount = (outstanding._sum?.total ?? 0) - (outstanding._sum?.paidAmount ?? 0);

    return {
      total,
      draft: findCount("DRAFT"),
      sent: findCount("SENT") + findCount("VIEWED"),
      paid: findCount("PAID"),
      overdue: findCount("OVERDUE"),
      totalRevenue,
      outstandingAmount,
      overdueAmount,
    };
  },

  async create(userId: string, data: CreateInvoiceRequest) {
    const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
    if (!client) throw new ApiError("CLIENT_NOT_FOUND", "Klien tidak ditemukan", 404);

    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      const company = await prisma.company.findUnique({ where: { userId } });
      const prefix = company?.invoicePrefix ?? "INV";
      invoiceNumber = await getNextInvoiceNumber(userId, prefix);
    } else {
      const dup = await prisma.invoice.findUnique({
        where: { userId_invoiceNumber: { userId, invoiceNumber } },
      });
      if (dup) throw new ApiError("DUPLICATE_NUMBER", "Nomor invoice sudah dipakai", 409);
    }

    const totals = calculateInvoiceTotals({
      items: data.items,
      taxRate: data.taxRate ?? 0,
      discountType: data.discountType ?? "PERCENTAGE",
      discountValue: data.discountValue ?? 0,
    });

    return prisma.invoice.create({
      data: {
        userId,
        clientId: data.clientId,
        invoiceNumber,
        status: data.status ?? "DRAFT",
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal: totals.subtotal,
        taxRate: data.taxRate ?? 0,
        taxAmount: totals.taxAmount,
        discountType: data.discountType ?? "PERCENTAGE",
        discountValue: data.discountValue ?? 0,
        discountAmount: totals.discountAmount,
        total: totals.total,
        notes: data.notes || null,
        terms: data.terms || null,
        template: data.template ?? "modern",
        isRecurring: data.isRecurring ?? false,
        recurringCycle: data.recurringCycle ?? null,
        items: {
          create: data.items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: Math.round(it.quantity * it.unitPrice),
            order: it.order ?? idx,
          })),
        },
      },
      include: { items: true, client: true },
    });
  },

  async update(userId: string, id: string, data: UpdateInvoiceRequest) {
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError("NOT_FOUND", "Invoice tidak ditemukan", 404);
    if (existing.status === "PAID") {
      throw new ApiError("INVOICE_PAID", "Invoice yang sudah lunas tidak bisa diubah", 400);
    }

    const items = data.items ?? null;
    const taxRate = data.taxRate ?? existing.taxRate;
    const discountType = data.discountType ?? existing.discountType ?? "PERCENTAGE";
    const discountValue = data.discountValue ?? existing.discountValue;

    let totals = {
      subtotal: existing.subtotal,
      taxAmount: existing.taxAmount,
      discountAmount: existing.discountAmount,
      total: existing.total,
    };

    if (items) {
      const calc = calculateInvoiceTotals({ items, taxRate, discountType, discountValue });
      totals = { subtotal: calc.subtotal, taxAmount: calc.taxAmount, discountAmount: calc.discountAmount, total: calc.total };
    }

    return prisma.$transaction(async (tx) => {
      if (items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceItem.createMany({
          data: items.map((it, idx) => ({
            invoiceId: id,
            name: it.name,
            description: it.description || null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: Math.round(it.quantity * it.unitPrice),
            order: it.order ?? idx,
          })),
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
          ...(data.invoiceNumber !== undefined ? { invoiceNumber: data.invoiceNumber } : {}),
          ...(data.issueDate !== undefined ? { issueDate: new Date(data.issueDate) } : {}),
          ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.terms !== undefined ? { terms: data.terms || null } : {}),
          ...(data.template !== undefined ? { template: data.template } : {}),
          ...(data.isRecurring !== undefined ? { isRecurring: data.isRecurring } : {}),
          ...(data.recurringCycle !== undefined ? { recurringCycle: data.recurringCycle } : {}),
          taxRate,
          discountType,
          discountValue,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total,
        },
        include: { items: true, client: true },
      });
    });
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError("NOT_FOUND", "Invoice tidak ditemukan", 404);
    if (existing.status === "PAID") {
      throw new ApiError("INVOICE_PAID", "Invoice yang sudah lunas tidak bisa dihapus", 400);
    }
    await prisma.invoice.delete({ where: { id } });
  },

  async duplicate(userId: string, id: string) {
    const original = await this.getById(userId, id);
    const company = await prisma.company.findUnique({ where: { userId } });
    const prefix = company?.invoicePrefix ?? "INV";
    const newNumber = await getNextInvoiceNumber(userId, prefix);
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return prisma.invoice.create({
      data: {
        userId,
        clientId: original.clientId,
        invoiceNumber: newNumber,
        status: "DRAFT",
        issueDate,
        dueDate,
        subtotal: original.subtotal,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        discountType: original.discountType,
        discountValue: original.discountValue,
        discountAmount: original.discountAmount,
        total: original.total,
        notes: original.notes,
        terms: original.terms,
        template: original.template,
        items: {
          create: original.items.map((it) => ({
            name: it.name,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            order: it.order,
          })),
        },
      },
      include: { items: true, client: true },
    });
  },

  async markAsSent(userId: string, id: string) {
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError("NOT_FOUND", "Invoice tidak ditemukan", 404);
    return prisma.invoice.update({
      where: { id },
      data: { status: existing.status === "DRAFT" ? "SENT" : existing.status, sentAt: existing.sentAt ?? new Date() },
    });
  },
};
```

---

## Step 3: Client API Routes

### File: `src/app/api/clients/route.ts`
- [ ] Buat:

```ts
import { z } from "zod";
import { handleApiError, jsonResponse, paginated, parseBody, requireAuth } from "@/lib/api-utils";
import { clientService } from "@/services/client.service";
import { clientSchema } from "@/lib/validations";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["name", "createdAt", "totalRevenue"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const params = listQuerySchema.parse(Object.fromEntries(searchParams));
    const { data, total } = await clientService.list(userId, params);
    return paginated(data, params.page, params.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, clientSchema);
    const client = await clientService.create(userId, data);
    return jsonResponse(client, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/clients/[id]/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { clientService } from "@/services/client.service";
import { clientSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const client = await clientService.getById(userId, id);
    return jsonResponse(client);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const data = await parseBody(req, clientSchema.partial());
    const client = await clientService.update(userId, id, data);
    return jsonResponse(client);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await clientService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/clients/[id]/invoices/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { clientService } from "@/services/client.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const invoices = await clientService.getInvoices(userId, id);
    return jsonResponse(invoices);
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 4: Client TanStack Query Hooks

### File: `src/hooks/use-clients.ts`
- [ ] Buat:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchPaginated, buildQuery } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { ClientWithStats } from "@/types/client";
import type { Client } from "@/types/client";
import type { CreateClientRequest, UpdateClientRequest, ClientListQuery } from "@/types/api-requests";

export function useClients(query: ClientListQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, query],
    queryFn: () => apiFetchPaginated<ClientWithStats>(`/clients${buildQuery(query as Record<string, unknown>)}`),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.client(id) : ["clients", "none"],
    queryFn: () => apiFetch<ClientWithStats>(`/clients/${id}`),
    enabled: !!id,
  });
}

export function useClientInvoices(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.clientInvoices(id) : ["clients", "none", "invoices"],
    queryFn: () => apiFetch(`/clients/${id}/invoices`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientRequest) =>
      apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      toast.success("Klien berhasil ditambahkan");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      apiFetch<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.client(id) });
      toast.success("Klien berhasil diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clients });
      toast.success("Klien berhasil dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
}
```

---

## Step 5: Client Form

### File: `src/components/forms/client-form.tsx`
- [ ] Buat dengan EXACT struktur:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientSchema } from "@/lib/validations";
import { PROVINCES_ID } from "@/lib/constants";
import type { ClientFormValues } from "@/types/forms";

interface Props {
  initialValues?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const DEFAULT_VALUES: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Indonesia",
  npwp: "",
  notes: "",
  isActive: true,
};

export function ClientForm({ initialValues, onSubmit, loading, submitLabel = "Simpan" }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });

  const province = watch("province");
  const isActive = watch("isActive");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="Contoh: Budi Santoso" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="email@contoh.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input id="phone" placeholder="+62 812 3456 7890" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company">Nama Perusahaan</Label>
            <Input id="company" placeholder="PT Contoh Sukses" {...register("company")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alamat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" rows={3} placeholder="Jalan, no, RT/RW" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Kota / Kabupaten</Label>
            <Input id="city" placeholder="Jakarta Selatan" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Provinsi</Label>
            <Select value={province || ""} onValueChange={(v) => setValue("province", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih provinsi" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES_ID.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Kode Pos</Label>
            <Input id="postalCode" placeholder="12345" {...register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Negara</Label>
            <Input id="country" {...register("country")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" placeholder="XX.XXX.XXX.X-XXX.XXX" {...register("npwp")} />
            {errors.npwp && <p className="text-xs text-destructive">{errors.npwp.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" rows={3} placeholder="Catatan internal" {...register("notes")} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 pt-2">
            <Switch checked={isActive} onCheckedChange={(c) => setValue("isActive", c)} id="isActive" />
            <Label htmlFor="isActive" className="font-normal">Klien aktif</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

---

## Step 6: Client Pages

### File: `src/components/tables/clients-table.tsx`
- [ ] Buat:

```tsx
"use client";

import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/format-currency";
import { TableSkeleton } from "@/components/custom/loading-skeleton";
import type { ClientWithStats } from "@/types/client";

interface Props {
  data: ClientWithStats[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export function ClientsTable({ data, loading, onDelete }: Props) {
  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Perusahaan</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total Invoice</TableHead>
            <TableHead className="text-right">Total Pendapatan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id} className="hover:bg-muted/50">
              <TableCell>
                <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.company || "-"}</TableCell>
              <TableCell className="text-sm">{c.email}</TableCell>
              <TableCell className="text-right font-mono text-sm">{c.totalInvoices}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(c.totalRevenue)}</TableCell>
              <TableCell>
                <Badge variant={c.isActive ? "default" : "secondary"}>
                  {c.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/clients/${c.id}`}><Eye className="mr-2 h-4 w-4" /> Lihat detail</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/clients/${c.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/create?clientId=${c.id}`}>
                        <FileText className="mr-2 h-4 w-4" /> Buat invoice
                      </Link>
                    </DropdownMenuItem>
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(c.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### File: `src/app/(app)/clients/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { ClientsTable } from "@/components/tables/clients-table";
import { SearchInput } from "@/components/custom/search-input";
import { EmptyState } from "@/components/custom/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useClients({ page, limit: 10, search: search || undefined });
  const deleteMutation = useDeleteClient();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Klien</h1>
          <p className="text-sm text-muted-foreground">Kelola data klien kamu</p>
        </div>
        <Button asChild>
          <Link href="/clients/create"><Plus className="mr-2 h-4 w-4" /> Tambah Klien</Link>
        </Button>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, email, perusahaan..." />
      </Card>

      {!isLoading && (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Klien tidak ditemukan" : "Belum ada klien"}
          description={search ? "Coba kata kunci lain" : "Mulai dengan menambah klien pertama kamu"}
          action={!search ? { label: "Tambah Klien", onClick: () => location.assign("/clients/create") } : undefined}
        />
      ) : (
        <ClientsTable data={data?.data ?? []} loading={isLoading} onDelete={setDeleteId} />
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {data.meta.page} dari {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus klien ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak bisa dibatalkan. Klien yang punya invoice tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### File: `src/app/(app)/clients/create/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { useCreateClient } from "@/hooks/use-clients";
import type { ClientFormValues } from "@/types/forms";

export default function CreateClientPage() {
  const router = useRouter();
  const create = useCreateClient();

  const handleSubmit = async (data: ClientFormValues) => {
    const client = await create.mutateAsync(data);
    router.push(`/clients/${client.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Klien</h1>
          <p className="text-sm text-muted-foreground">Masukkan data klien baru</p>
        </div>
      </div>
      <ClientForm onSubmit={handleSubmit} loading={create.isPending} submitLabel="Simpan Klien" />
    </div>
  );
}
```

### File: `src/app/(app)/clients/[id]/edit/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/forms/client-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import type { ClientFormValues } from "@/types/forms";

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading } = useClient(id);
  const update = useUpdateClient();

  const handleSubmit = async (data: ClientFormValues) => {
    await update.mutateAsync({ id, data });
    router.push(`/clients/${id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Klien</h1>
          <p className="text-sm text-muted-foreground">Perbarui data klien</p>
        </div>
      </div>
      {isLoading || !client ? (
        <FormSkeleton />
      ) : (
        <ClientForm
          initialValues={{
            name: client.name,
            email: client.email,
            phone: client.phone ?? "",
            company: client.company ?? "",
            address: client.address ?? "",
            city: client.city ?? "",
            province: client.province ?? "",
            postalCode: client.postalCode ?? "",
            country: client.country,
            npwp: client.npwp ?? "",
            notes: client.notes ?? "",
            isActive: client.isActive,
          }}
          onSubmit={handleSubmit}
          loading={update.isPending}
          submitLabel="Update Klien"
        />
      )}
    </div>
  );
}
```

### File: `src/app/(app)/clients/[id]/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, FileText, Mail, MapPin, Phone, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClient, useClientInvoices } from "@/hooks/use-clients";
import { StatsCard } from "@/components/custom/stats-card";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: client, isLoading } = useClient(id);
  const { data: invoices } = useClientInvoices(id);

  if (isLoading || !client) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.company || "Individual"}</p>
          </div>
          <Badge variant={client.isActive ? "default" : "secondary"}>
            {client.isActive ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          <Button asChild>
            <Link href={`/invoices/create?clientId=${id}`}><FileText className="mr-2 h-4 w-4" /> Buat Invoice</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Invoice" value={client.totalInvoices} icon={Receipt} variant="info" />
        <StatsCard title="Total Pendapatan" value={formatCurrency(client.totalRevenue)} icon={Wallet} variant="success" />
        <StatsCard title="Belum Dibayar" value={formatCurrency(client.outstandingAmount)} icon={Receipt} variant="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div>{client.address}</div>
                  <div>{[client.city, client.province, client.postalCode].filter(Boolean).join(", ")}</div>
                  <div>{client.country}</div>
                </div>
              </div>
            )}
            {client.npwp && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">NPWP</div>
                <div className="font-mono">{client.npwp}</div>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Catatan</div>
                <p>{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {(invoices as any[] | undefined)?.length ? (
              <div className="space-y-2">
                {(invoices as any[]).map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{formatCurrency(inv.total)}</span>
                      <InvoiceStatusBadge status={inv.status} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada invoice untuk klien ini</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Step 7: Invoice Number Generator API

### File: `src/app/api/invoices/number/next/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/utils/generate-invoice-number";

export async function GET() {
  try {
    const userId = await requireAuth();
    const company = await prisma.company.findUnique({ where: { userId } });
    const prefix = company?.invoicePrefix ?? "INV";
    const number = await getNextInvoiceNumber(userId, prefix);
    return jsonResponse({ invoiceNumber: number });
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 8: Invoice API Routes

### File: `src/app/api/invoices/route.ts`
- [ ] Buat:

```ts
import { z } from "zod";
import { handleApiError, jsonResponse, paginated, parseBody, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { invoiceSchema } from "@/lib/validations";
import { INVOICE_STATUSES } from "@/lib/constants";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.union([z.enum(INVOICE_STATUSES), z.literal("ALL")]).optional(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["invoiceNumber", "issueDate", "dueDate", "total", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const params = listSchema.parse(Object.fromEntries(searchParams));
    const { data, total } = await invoiceService.list(userId, params);
    return paginated(data, params.page, params.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const data = invoiceSchema.parse({
      ...body,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    const invoice = await invoiceService.create(userId, {
      ...data,
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
    });
    return jsonResponse(invoice, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/invoices/[id]/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { invoiceSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const invoice = await invoiceService.getById(userId, id);
    return jsonResponse(invoice);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const partial = invoiceSchema.partial().parse({
      ...body,
      ...(body.issueDate ? { issueDate: new Date(body.issueDate) } : {}),
      ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
    });
    const invoice = await invoiceService.update(userId, id, {
      ...partial,
      ...(partial.issueDate ? { issueDate: partial.issueDate.toISOString() } : {}),
      ...(partial.dueDate ? { dueDate: partial.dueDate.toISOString() } : {}),
    });
    return jsonResponse(invoice);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await invoiceService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/invoices/stats/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const stats = await invoiceService.getStats(userId);
    return jsonResponse(stats);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/invoices/[id]/duplicate/route.ts`
- [ ] Buat:

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const invoice = await invoiceService.duplicate(userId, id);
    return jsonResponse(invoice, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### File: `src/app/api/invoices/[id]/send/route.ts`
- [ ] Buat (stub Phase 2, real email di Phase 3):

```ts
import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const invoice = await invoiceService.markAsSent(userId, id);
    return jsonResponse(invoice);
  } catch (e) {
    return handleApiError(e);
  }
}
```

---

## Step 9: Invoice TanStack Query Hooks

### File: `src/hooks/use-invoices.ts`
- [ ] Buat:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchPaginated, buildQuery } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { Invoice, InvoiceWithRelations, InvoiceListItem, InvoiceStats } from "@/types/invoice";
import type { CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceListQuery } from "@/types/api-requests";

export function useInvoices(query: InvoiceListQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.invoices, query],
    queryFn: () =>
      apiFetchPaginated<InvoiceListItem>(`/invoices${buildQuery(query as Record<string, unknown>)}`),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.invoice(id) : ["invoices", "none"],
    queryFn: () => apiFetch<InvoiceWithRelations>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: QUERY_KEYS.invoiceStats,
    queryFn: () => apiFetch<InvoiceStats>("/invoices/stats"),
  });
}

export function useNextInvoiceNumber() {
  return useQuery({
    queryKey: QUERY_KEYS.invoiceNumber,
    queryFn: () => apiFetch<{ invoiceNumber: string }>("/invoices/number/next"),
    staleTime: 0,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) =>
      apiFetch<Invoice>("/invoices", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil dibuat");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) =>
      apiFetch<Invoice>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoiceStats });
      toast.success("Invoice berhasil dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDuplicateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Invoice>(`/invoices/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      toast.success("Invoice berhasil diduplikasi");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Invoice>(`/invoices/${id}/send`, { method: "POST" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoice(id) });
      toast.success("Invoice ditandai terkirim");
    },
    onError: (e) => toast.error(e.message),
  });
}
```

---

## Step 10: Item Editor Component

### File: `src/components/custom/item-editor.tsx`
- [ ] Buat:

```tsx
"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/custom/currency-input";
import { formatCurrency } from "@/utils/format-currency";
import type { ItemEditorProps } from "@/types/component-props";
import type { InvoiceItemFormValues } from "@/types/forms";

export function ItemEditor({ items, onChange, currency = "IDR", disabled }: ItemEditorProps) {
  const update = (idx: number, patch: Partial<InvoiceItemFormValues>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const add = () => {
    onChange([
      ...items,
      { name: "", description: "", quantity: 1, unitPrice: 0, order: items.length },
    ]);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="w-24 p-3 text-right">Qty</th>
              <th className="w-44 p-3 text-right">Harga Satuan</th>
              <th className="w-44 p-3 text-right">Total</th>
              <th className="w-12 p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => {
              const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              return (
                <tr key={idx} className="align-top">
                  <td className="p-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.name}
                      onChange={(e) => update(idx, { name: e.target.value })}
                      placeholder="Contoh: Jasa Desain"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.description ?? ""}
                      onChange={(e) => update(idx, { description: e.target.value })}
                      placeholder="Detail item (opsional)"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => update(idx, { quantity: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                      className="text-right font-mono"
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-2">
                    <CurrencyInput
                      value={Number(item.unitPrice) || 0}
                      onChange={(v) => update(idx, { unitPrice: v })}
                      currency={currency}
                      disabled={disabled}
                    />
                  </td>
                  <td className="p-3 text-right font-mono">{formatCurrency(total, currency)}</td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={disabled || items.length <= 1}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" onClick={add} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Item
      </Button>
    </div>
  );
}
```

---

## Step 11: Client Select Component

### File: `src/components/custom/client-select.tsx`
- [ ] Buat:

```tsx
"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useClients } from "@/hooks/use-clients";
import type { ClientSelectProps } from "@/types/component-props";

export function ClientSelect({ value, onChange, onCreateNew, placeholder = "Pilih klien...", disabled }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useClients({ limit: 50, search: search || undefined, isActive: true });

  const selected = data?.data.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          type="button"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selected.name}</span>
              {selected.company && <span className="text-xs text-muted-foreground">· {selected.company}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Cari klien..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              <div className="p-3 text-sm">
                Klien tidak ditemukan
                {onCreateNew && (
                  <Button variant="link" type="button" className="ml-1 h-auto p-0" onClick={onCreateNew}>
                    Buat baru
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {data?.data.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <CommandGroup>
                <CommandItem onSelect={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah klien baru
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Step 12: Invoice Form

### File: `src/components/forms/invoice-form.tsx`
- [ ] Buat:

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemEditor } from "@/components/custom/item-editor";
import { ClientSelect } from "@/components/custom/client-select";
import { CurrencyInput } from "@/components/custom/currency-input";
import { invoiceSchema } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/utils/calculate-totals";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import {
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_LABELS,
  RECURRING_CYCLES,
  RECURRING_CYCLE_LABELS,
} from "@/lib/constants";
import type { InvoiceFormValues } from "@/types/forms";

interface Props {
  initialValues?: Partial<InvoiceFormValues>;
  onSubmit: (data: InvoiceFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const today = new Date();
const inThirtyDays = new Date();
inThirtyDays.setDate(inThirtyDays.getDate() + 30);

const DEFAULTS: InvoiceFormValues = {
  invoiceNumber: "",
  clientId: "",
  issueDate: today,
  dueDate: inThirtyDays,
  template: "modern",
  items: [{ name: "", description: "", quantity: 1, unitPrice: 0, order: 0 }],
  taxRate: 11,
  discountType: "PERCENTAGE",
  discountValue: 0,
  notes: "",
  terms: "Pembayaran dilakukan dalam 30 hari sejak tanggal invoice diterbitkan.",
  isRecurring: false,
  recurringCycle: null,
};

export function InvoiceForm({ initialValues, onSubmit, loading, submitLabel = "Simpan" }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { ...DEFAULTS, ...initialValues },
  });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const isRecurring = watch("isRecurring");
  const issueDate = watch("issueDate");
  const dueDate = watch("dueDate");
  const template = watch("template");

  const totals = useMemo(
    () => calculateInvoiceTotals({ items, taxRate, discountType, discountValue }),
    [items, taxRate, discountType, discountValue]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Info Invoice */}
      <Card>
        <CardHeader><CardTitle>Informasi Invoice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Nomor Invoice <span className="text-destructive">*</span></Label>
            <Input id="invoiceNumber" placeholder="INV-2026-0001" {...register("invoiceNumber")} className="font-mono" />
            {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={(v) => setValue("template", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{INVOICE_TEMPLATE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Terbit <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !issueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issueDate ? format(issueDate, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={issueDate} onSelect={(d) => d && setValue("issueDate", d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Jatuh Tempo <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd MMMM yyyy", { locale: localeID }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setValue("dueDate", d)} />
              </PopoverContent>
            </Popover>
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Klien */}
      <Card>
        <CardHeader><CardTitle>Klien <span className="text-destructive">*</span></CardTitle></CardHeader>
        <CardContent>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientSelect
                value={field.value}
                onChange={(id) => field.onChange(id ?? "")}
                onCreateNew={() => window.open("/clients/create", "_blank")}
              />
            )}
          />
          {errors.clientId && <p className="mt-2 text-xs text-destructive">{errors.clientId.message}</p>}
        </CardContent>
      </Card>

      {/* Section 3: Items */}
      <Card>
        <CardHeader><CardTitle>Item</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="items"
            control={control}
            render={({ field }) => <ItemEditor items={field.value} onChange={field.onChange} />}
          />
          {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxRate">PPN (%)</Label>
              <Input id="taxRate" type="number" min="0" max="100" step="0.1" {...register("taxRate", { valueAsNumber: true })} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Diskon</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(v) => setValue("discountType", v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Persen %</SelectItem>
                    <SelectItem value="FIXED">Jumlah Rp</SelectItem>
                  </SelectContent>
                </Select>
                {discountType === "FIXED" ? (
                  <CurrencyInput value={discountValue} onChange={(v) => setValue("discountValue", v)} className="flex-1" />
                ) : (
                  <Input type="number" min="0" max="100" step="0.1" value={discountValue} onChange={(e) => setValue("discountValue", Number(e.target.value))} className="flex-1 font-mono" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Diskon</span>
              <span className="font-mono">- {formatCurrency(totals.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>PPN ({taxRate}%)</span>
              <span className="font-mono">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>TOTAL</span>
              <span className="font-mono text-primary">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Tambahan */}
      <Card>
        <CardHeader><CardTitle>Catatan & Syarat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" rows={3} placeholder="Pesan untuk klien" {...register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Syarat & Ketentuan</Label>
            <Textarea id="terms" rows={3} {...register("terms")} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isRecurring} onCheckedChange={(c) => setValue("isRecurring", c)} id="isRecurring" />
            <Label htmlFor="isRecurring" className="font-normal">Invoice berulang (recurring)</Label>
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <Label>Siklus Pengulangan</Label>
              <Select
                value={watch("recurringCycle") ?? ""}
                onValueChange={(v) => setValue("recurringCycle", v as any)}
              >
                <SelectTrigger><SelectValue placeholder="Pilih siklus" /></SelectTrigger>
                <SelectContent>
                  {RECURRING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{RECURRING_CYCLE_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

---

## Step 13: Invoice Pages

### File: `src/components/tables/invoices-table.tsx`
- [ ] Buat:

```tsx
"use client";

import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { TableSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import type { InvoiceListItem } from "@/types/invoice";

interface Props {
  data: InvoiceListItem[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onSend?: (id: string) => void;
}

export function InvoicesTable({ data, loading, onDelete, onDuplicate, onSend }: Props) {
  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Invoice</TableHead>
            <TableHead>Klien</TableHead>
            <TableHead>Tgl Terbit</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((inv) => (
            <TableRow key={inv.id} className="hover:bg-muted/50">
              <TableCell>
                <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium hover:underline">
                  {inv.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{inv.client.name}</div>
                  {inv.client.company && <div className="text-xs text-muted-foreground">{inv.client.company}</div>}
                </div>
              </TableCell>
              <TableCell className="text-sm">{formatDate(inv.issueDate)}</TableCell>
              <TableCell className="text-sm">{formatDate(inv.dueDate)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(inv.total)}</TableCell>
              <TableCell><InvoiceStatusBadge status={inv.status} size="sm" /></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${inv.id}`}><Eye className="mr-2 h-4 w-4" /> Detail</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${inv.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                    </DropdownMenuItem>
                    {onSend && inv.status === "DRAFT" && (
                      <DropdownMenuItem onClick={() => onSend(inv.id)}>
                        <Send className="mr-2 h-4 w-4" /> Tandai Terkirim
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(inv.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplikasi
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(inv.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### File: `src/app/(app)/invoices/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useInvoices, useDeleteInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { SearchInput } from "@/components/custom/search-input";
import { EmptyState } from "@/components/custom/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InvoiceStatus } from "@/lib/constants";

const TABS: { value: InvoiceStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Terkirim" },
  { value: "PAID", label: "Lunas" },
  { value: "OVERDUE", label: "Jatuh Tempo" },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useInvoices({
    page,
    limit: 10,
    search: search || undefined,
    status,
  });
  const del = useDeleteInvoice();
  const dup = useDuplicateInvoice();
  const send = useSendInvoice();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await del.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice</h1>
          <p className="text-sm text-muted-foreground">Buat & kelola semua invoice kamu</p>
        </div>
        <Button asChild>
          <Link href="/invoices/create"><Plus className="mr-2 h-4 w-4" /> Buat Invoice</Link>
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
          <TabsList>
            {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nomor invoice atau klien..." />
      </Card>

      {!isLoading && (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? "Invoice tidak ditemukan" : "Belum ada invoice"}
          description={search ? "Coba kata kunci atau filter lain" : "Buat invoice pertama kamu sekarang"}
          action={!search ? { label: "Buat Invoice", onClick: () => location.assign("/invoices/create") } : undefined}
        />
      ) : (
        <InvoicesTable
          data={data?.data ?? []}
          loading={isLoading}
          onDelete={setDeleteId}
          onDuplicate={(id) => dup.mutate(id)}
          onSend={(id) => send.mutate(id)}
        />
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Halaman {data.meta.page} dari {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus invoice ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak bisa dibatalkan. Invoice yang sudah lunas tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### File: `src/app/(app)/invoices/create/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useCreateInvoice, useNextInvoiceNumber } from "@/hooks/use-invoices";
import type { InvoiceFormValues } from "@/types/forms";

export default function CreateInvoicePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetClientId = sp.get("clientId") ?? "";
  const { data: nextNum, isLoading } = useNextInvoiceNumber();
  const create = useCreateInvoice();

  const handleSubmit = async (data: InvoiceFormValues) => {
    const invoice = await create.mutateAsync({
      ...data,
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      items: data.items.map((it, idx) => ({
        name: it.name,
        description: it.description || undefined,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        order: idx,
      })),
    });
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat Invoice</h1>
          <p className="text-sm text-muted-foreground">Isi detail invoice di bawah</p>
        </div>
      </div>
      {isLoading ? (
        <FormSkeleton />
      ) : (
        <InvoiceForm
          initialValues={{
            invoiceNumber: nextNum?.invoiceNumber ?? "",
            clientId: presetClientId,
          }}
          onSubmit={handleSubmit}
          loading={create.isPending}
          submitLabel="Simpan Invoice"
        />
      )}
    </div>
  );
}
```

### File: `src/app/(app)/invoices/[id]/edit/page.tsx`
- [ ] Buat:

```tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import type { InvoiceFormValues } from "@/types/forms";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(id);
  const update = useUpdateInvoice();

  const handleSubmit = async (data: InvoiceFormValues) => {
    await update.mutateAsync({
      id,
      data: {
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        items: data.items.map((it, idx) => ({
          name: it.name,
          description: it.description || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          order: idx,
        })),
      },
    });
    router.push(`/invoices/${id}`);
  };

  if (isLoading || !invoice) return <FormSkeleton />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/invoices/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
      </div>
      <InvoiceForm
        initialValues={{
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          template: invoice.template as any,
          items: invoice.items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? "",
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            order: it.order,
          })),
          taxRate: invoice.taxRate,
          discountType: (invoice.discountType ?? "PERCENTAGE") as any,
          discountValue: invoice.discountValue,
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
          isRecurring: invoice.isRecurring,
          recurringCycle: invoice.recurringCycle ?? null,
        }}
        onSubmit={handleSubmit}
        loading={update.isPending}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
```

### File: `src/app/(app)/invoices/[id]/page.tsx`
- [ ] Buat versi DASAR (akan di-enhance di Phase 3):

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Send, Copy, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoice, useDeleteInvoice, useDuplicateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { InvoiceStatusBadge } from "@/components/custom/invoice-status-badge";
import { FormSkeleton } from "@/components/custom/loading-skeleton";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: invoice, isLoading } = useInvoice(id);
  const del = useDeleteInvoice();
  const dup = useDuplicateInvoice();
  const send = useSendInvoice();

  if (isLoading || !invoice) return <FormSkeleton />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.client.name} · {formatDate(invoice.issueDate, "long")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/invoices/${id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
          </Button>
          {invoice.status === "DRAFT" && (
            <Button onClick={() => send.mutate(id)}><Send className="mr-2 h-4 w-4" /> Kirim</Button>
          )}
          <Button variant="outline" onClick={() => dup.mutate(id)}><Copy className="mr-2 h-4 w-4" /> Duplikasi</Button>
          <Button variant="outline" asChild>
            <a href={`/api/invoices/${id}/pdf`} target="_blank"><Download className="mr-2 h-4 w-4" /> PDF</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <div className="text-xs text-muted-foreground">Klien</div>
              <div className="font-medium">{invoice.client.name}</div>
              {invoice.client.company && <div className="text-sm">{invoice.client.company}</div>}
              <div className="text-sm">{invoice.client.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Jatuh Tempo</div>
              <div className="font-medium">{formatDate(invoice.dueDate, "long")}</div>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="w-20 p-3 text-right">Qty</th>
                  <th className="w-40 p-3 text-right">Harga</th>
                  <th className="w-40 p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-3">
                      <div className="font-medium">{it.name}</div>
                      {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                    </td>
                    <td className="p-3 text-right font-mono">{it.quantity}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 ml-auto max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span><span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Diskon</span><span className="font-mono">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>PPN ({invoice.taxRate}%)</span><span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>TOTAL</span><span className="font-mono text-primary">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Sudah Dibayar</span><span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Sisa</span><span className="font-mono">{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                </div>
              </>
            )}
          </div>

          {invoice.notes && (
            <div className="mt-6 p-4 rounded-md bg-muted/30">
              <div className="text-xs uppercase text-muted-foreground mb-1">Catatan</div>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="mt-3 p-4 rounded-md bg-muted/30">
              <div className="text-xs uppercase text-muted-foreground mb-1">Syarat & Ketentuan</div>
              <p className="text-sm">{invoice.terms}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 14: Verifikasi

- [ ] Jalankan `npm run dev`
- [ ] Login: `budi@invoiceforge.id` / `Password123!`
- [ ] Navigasi ke `/clients`:
  - [ ] List 10 client tampil
  - [ ] Search bekerja
  - [ ] Klik "+ Tambah Klien" → form muncul
  - [ ] Submit form invalid (kosong name) → error muncul dalam Bahasa Indonesia
  - [ ] Buat client baru → redirect ke detail
  - [ ] Edit client → simpan → data ter-update
- [ ] Navigasi ke `/invoices`:
  - [ ] List 30 invoice tampil
  - [ ] Filter status "Lunas" → hanya invoice PAID
  - [ ] Search "INV-2026-0001" → hanya 1 row
  - [ ] Klik "+ Buat Invoice":
    - [ ] Nomor invoice auto-fill
    - [ ] Pilih klien dari dropdown bekerja
    - [ ] Tambah item bekerja
    - [ ] Subtotal/PPN/Total kalkulasi otomatis
    - [ ] Submit → redirect ke detail
  - [ ] Edit invoice → ubah quantity → total update
  - [ ] Duplikasi invoice → invoice baru muncul dengan status DRAFT
  - [ ] Hapus invoice DRAFT → terhapus
  - [ ] Hapus invoice PAID → muncul error "Invoice yang sudah lunas tidak bisa dihapus"

---

## Checklist Akhir Phase 2

- [ ] API helper (`api-utils`, `api-client`) selesai
- [ ] Service layer (client, invoice) selesai
- [ ] 4 client API routes selesai
- [ ] 5 invoice API routes selesai
- [ ] TanStack Query hooks (clients, invoices) selesai
- [ ] Client form & pages (list, create, edit, detail) selesai
- [ ] Invoice form (4 sections) & pages selesai
- [ ] Invoice number auto-generation bekerja
- [ ] Currency formatting `Rp X.XXX.XXX` bekerja
- [ ] Date formatting locale Indonesia bekerja
- [ ] Item editor: tambah/hapus/edit + auto-calculate total
- [ ] Tax & discount calculation benar
- [ ] Validation Indonesia (semua error message dalam Bahasa Indonesia)
- [ ] Tidak ada error TypeScript (`npm run build` sukses)
- [ ] **SIAP LANJUT KE PHASE 3** ✅
