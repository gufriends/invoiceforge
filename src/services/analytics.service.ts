import { prisma } from "@/lib/prisma";

export const analyticsService = {
  async overview(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisMonth = startOfMonth;

    const [thisMonth, prevMonth, activeInvoices, draftInvoices, activeClients, newClientsThisMonth, overdue] = await Promise.all([
      prisma.payment.aggregate({
        where: { invoice: { userId }, date: { gte: startOfThisMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: { userId },
          date: { gte: startOfPrevMonth, lt: startOfThisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { userId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.invoice.count({ where: { userId, status: "DRAFT" } }),
      prisma.client.count({ where: { userId, isActive: true } }),
      prisma.client.count({ where: { userId, createdAt: { gte: startOfThisMonth } } }),
      prisma.invoice.aggregate({
        where: { userId, status: "OVERDUE" },
        _sum: { total: true, paidAmount: true },
        _count: { _all: true },
      }),
    ]);

    const thisMonthRev = thisMonth._sum?.amount ?? 0;
    const prevMonthRev = prevMonth._sum?.amount ?? 0;
    const revenueChange = prevMonthRev === 0 ? (thisMonthRev > 0 ? 100 : 0) : ((thisMonthRev - prevMonthRev) / prevMonthRev) * 100;
    const overdueAmount = (overdue._sum?.total ?? 0) - (overdue._sum?.paidAmount ?? 0);

    return {
      totalRevenue: thisMonthRev,
      revenueChange: Math.round(revenueChange * 10) / 10,
      activeInvoices,
      draftInvoices,
      activeClients,
      newClientsThisMonth,
      overdueCount: overdue._count?._all ?? 0,
      overdueAmount,
    };
  },

  async revenueByMonth(userId: string, months: number = 12) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const payments = await prisma.payment.findMany({
      where: { invoice: { userId }, date: { gte: start } },
      select: { amount: true, date: true, invoiceId: true },
    });

    const byMonth = new Map<string, { revenue: number; invoiceIds: Set<string> }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, { revenue: 0, invoiceIds: new Set() });
    }
    payments.forEach((p) => {
      const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = byMonth.get(key);
      if (entry) {
        entry.revenue += p.amount;
        entry.invoiceIds.add(p.invoiceId);
      }
    });

    return Array.from(byMonth.entries()).map(([period, { revenue, invoiceIds }]) => ({
      period,
      revenue: Math.round(revenue),
      invoiceCount: invoiceIds.size,
    }));
  },

  async statusDistribution(userId: string) {
    const grouped = await prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
      _sum: { total: true },
    });
    return grouped.map((g) => ({
      status: g.status,
      count: g._count?._all ?? 0,
      amount: g._sum?.total ?? 0,
    }));
  },

  async topClients(userId: string, limit: number = 5) {
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        invoices: {
          select: { paidAmount: true, status: true },
        },
      },
    });

    return clients
      .map((c) => ({
        clientId: c.id,
        clientName: c.name,
        invoiceCount: c.invoices.length,
        totalRevenue: c.invoices.reduce(
          (sum, inv) => (inv.status === "PAID" || inv.status === "PARTIAL" ? sum + inv.paidAmount : sum),
          0
        ),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  async paymentMethods(userId: string) {
    const payments = await prisma.payment.groupBy({
      by: ["method"],
      where: { invoice: { userId } },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return payments.map((p) => ({
      method: p.method,
      count: p._count?._all ?? 0,
      amount: p._sum?.amount ?? 0,
    }));
  },

  async aging(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { userId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      select: { total: true, paidAmount: true, dueDate: true },
    });
    const now = new Date();
    const buckets = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlusDays: 0 };
    invoices.forEach((inv) => {
      const outstanding = inv.total - inv.paidAmount;
      if (outstanding <= 0) return;
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 0) buckets.current += outstanding;
      else if (daysOverdue <= 30) buckets.thirtyDays += outstanding;
      else if (daysOverdue <= 60) buckets.sixtyDays += outstanding;
      else buckets.ninetyPlusDays += outstanding;
    });
    return buckets;
  },
};