import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { invoiceBaseSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const invoice = await invoiceService.getById(userId, id);
    return jsonResponse(invoice);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const partial = invoiceBaseSchema.partial().parse({
      ...body,
      ...(body.issueDate ? { issueDate: new Date(body.issueDate) } : {}),
      ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
    });
    const { issueDate, dueDate, ...rest } = partial;
    const invoice = await invoiceService.update(userId, id, {
      ...rest,
      ...(issueDate ? { issueDate: issueDate.toISOString() } : {}),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
    });
    return jsonResponse(invoice);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await invoiceService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}