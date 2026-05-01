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
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { company: { contains: search, mode: "insensitive" as const } },
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