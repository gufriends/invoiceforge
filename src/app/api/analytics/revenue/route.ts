import { handleApiError, jsonResponse, requireAuth } from "@/lib/api-utils";
import { analyticsService } from "@/services/analytics.service";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const months = Math.min(36, Math.max(1, Number(searchParams.get("months") ?? "12")));
    const data = await analyticsService.revenueByMonth(userId, months);
    return jsonResponse(data);
  } catch (e) {
    return handleApiError(e);
  }
}