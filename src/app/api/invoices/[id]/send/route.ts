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