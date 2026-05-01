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