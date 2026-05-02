import { z } from "zod";
import { handleApiError, jsonResponse, paginated, parseBody, requireAuth } from "@/lib/api-utils";
import { invoiceService } from "@/services/invoice.service";
import { invoiceSchema } from "@/lib/validations";
import { INVOICE_STATUSES } from "@/lib/constants";

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.union([z.enum(INVOICE_STATUSES), z.literal("ALL")]).optional(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["invoiceNumber", "issueDate", "dueDate", "total", "createdAt", "clientName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const params = listSchema.parse(Object.fromEntries(searchParams));
    const { data, total } = await invoiceService.list(userId, params);
    return paginated(data, params.page, params.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const data = invoiceSchema.parse({
      ...body,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    const invoice = await invoiceService.create(userId, {
      ...data,
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
    });
    return jsonResponse(invoice, 201);
  } catch (e) {
    return handleApiError(e);
  }
}