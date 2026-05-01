import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { paymentService } from "@/services/payment.service";
import { paymentSchema } from "@/lib/validations";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const data = await parseBody(req, paymentSchema.partial());
    const payment = await paymentService.update(userId, id, {
      ...data,
      date: data.date?.toISOString(),
    });
    return jsonResponse(payment);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await paymentService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}