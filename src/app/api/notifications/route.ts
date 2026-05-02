import { NextResponse } from "next/server";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { notificationService } from "@/services/notification.service";

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const result = await notificationService.list(userId, { limit, cursor, unreadOnly });
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    if (body.action === "mark_all_read") {
      await notificationService.markAllAsRead(userId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return handleApiError(e);
  }
}
