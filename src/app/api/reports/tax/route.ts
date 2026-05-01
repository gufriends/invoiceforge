import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ["PAID", "PARTIAL"] },
        ...(startDate || endDate
          ? {
              issueDate: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      select: {
        invoiceNumber: true,
        issueDate: true,
        subtotal: true,
        taxRate: true,
        taxAmount: true,
        total: true,
        client: { select: { name: true, npwp: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const totalDPP = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    return jsonResponse({ invoices, totalTax, totalDPP });
  } catch (e) {
    return handleApiError(e);
  }
}