import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notification.service";

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

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "VIEWED", "PARTIAL"] },
      dueDate: { lt: now },
    },
    include: { client: true },
  });

  if (overdueInvoices.length > 0) {
    await prisma.invoice.updateMany({
      where: { id: { in: overdueInvoices.map((i) => i.id) } },
      data: { status: "OVERDUE" },
    });
  }

  let notified = 0;
  for (const invoice of overdueInvoices) {
    const alreadyNotified = await notificationService.hasOverdueNotification(invoice.userId, invoice.id);
    if (!alreadyNotified) {
      await notificationService.create(invoice.userId, {
        type: "INVOICE_OVERDUE",
        title: "Invoice Jatuh Tempo",
        message: `${invoice.invoiceNumber} untuk ${invoice.client.name} sudah melewati jatuh tempo`,
        link: `/invoices/${invoice.id}`,
        metadata: { invoiceId: invoice.id },
      });
      notified++;
    }
  }

  return NextResponse.json({
    data: { markedOverdue: overdueInvoices.length, notified, runAt: now.toISOString() },
  });
}
