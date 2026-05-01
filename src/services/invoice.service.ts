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
    const discountType = (data.discountType ?? existing.discountType ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED";
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