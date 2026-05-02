import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { notificationService } from "@/services/notification.service";

export async function GET() {
  try {
    const userId = await requireAuth();
    const count = await notificationService.unreadCount(userId);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
