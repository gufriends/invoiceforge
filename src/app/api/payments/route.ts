import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { paymentService } from "@/services/payment.service";
import { paymentSchema } from "@/lib/validations";
import { z } from "zod";

const createSchema = paymentSchema.extend({ invoiceId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, createSchema);
    const payment = await paymentService.create(userId, {
      ...data,
      date: data.date.toISOString(),
      reference: data.reference || undefined,
      notes: data.notes || undefined,
    });
    return jsonResponse(payment, 201);
  } catch (e) {
    return handleApiError(e);
  }
}