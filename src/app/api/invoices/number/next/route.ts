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