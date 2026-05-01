import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid cron secret" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ["SENT", "VIEWED", "PARTIAL"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  return NextResponse.json({
    data: { markedOverdue: result.count, runAt: now.toISOString() },
  });
}
