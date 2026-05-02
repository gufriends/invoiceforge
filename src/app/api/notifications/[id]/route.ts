import { NextResponse } from "next/server";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { notificationService } from "@/services/notification.service";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    await notificationService.markAsRead(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
