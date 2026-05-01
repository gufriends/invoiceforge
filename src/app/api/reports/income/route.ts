import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const payments = await prisma.payment.findMany({
      where: {
        invoice: { userId },
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        invoice: { select: { invoiceNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return jsonResponse({ payments, total });
  } catch (e) {
    return handleApiError(e);
  }
}