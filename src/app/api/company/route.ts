import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";
import { companyService } from "@/services/company.service";
import { companySchema } from "@/lib/validations";
import type { UpdateCompanyRequest } from "@/types/api-requests";

export async function GET() {
  try {
    const userId = await requireAuth();
    const company = await companyService.get(userId);
    return jsonResponse(company);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, companySchema.partial());
    const company = await companyService.update(userId, data as UpdateCompanyRequest);
    return jsonResponse(company);
  } catch (e) {
    return handleApiError(e);
  }
}