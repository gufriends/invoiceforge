import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await analyticsService.statusDistribution(userId);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}