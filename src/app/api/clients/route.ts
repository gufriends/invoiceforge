import { z } from "zod";
import { handleApiError, jsonResponse, paginated, parseBody, requireAuth } from "@/lib/api-utils";
import { clientService } from "@/services/client.service";
import { clientSchema } from "@/lib/validations";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["name", "createdAt", "totalRevenue"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const params = listQuerySchema.parse(Object.fromEntries(searchParams));
    const { data, total } = await clientService.list(userId, params);
    return paginated(data, params.page, params.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, clientSchema);
    const client = await clientService.create(userId, data);
    return jsonResponse(client, 201);
  } catch (e) {
    return handleApiError(e);
  }
}