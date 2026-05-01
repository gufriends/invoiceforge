import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { clientService } from "@/services/client.service";
import { clientSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const client = await clientService.getById(userId, id);
    return jsonResponse(client);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const data = await parseBody(req, clientSchema.partial());
    const client = await clientService.update(userId, id, data);
    return jsonResponse(client);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await clientService.delete(userId, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}