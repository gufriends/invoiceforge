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