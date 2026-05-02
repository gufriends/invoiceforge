import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/utils/generate-invoice-number";
import { notificationService } from "@/services/notification.service";
import type { RecurringCycle } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

function advanceDate(from: Date, cycle: RecurringCycle): Date {
  const next = new Date(from);
  switch (cycle) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid cron secret" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.invoice.findMany({
    where: {
      isRecurring: true,
      recurringCycle: { not: null },
      recurringNext: { lte: now },
    },
    include: { items: true },
  });

  const created: string[] = [];
  const errors: { invoiceId: string; error: string }[] = [];

  for (const original of due) {
    try {
      const cycle = original.recurringCycle as RecurringCycle | null;
      if (!cycle) continue;

      const company = await prisma.company.findUnique({ where: { userId: original.userId } });
      const prefix = company?.invoicePrefix ?? "INV";
      const newNumber = await getNextInvoiceNumber(original.userId, prefix);

      const issueDate = new Date(now);
      const dueDate = new Date(now);
      dueDate.setDate(
        dueDate.getDate() +
          Math.max(
            1,
            Math.round(
              (original.dueDate.getTime() - original.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
      );

      await prisma.$transaction(async (tx) => {
        const newInvoice = await tx.invoice.create({
          data: {
            userId: original.userId,
            clientId: original.clientId,
            invoiceNumber: newNumber,
            status: "DRAFT",
            issueDate,
            dueDate,
            subtotal: original.subtotal,
            taxRate: original.taxRate,
            taxAmount: original.taxAmount,
            discountType: original.discountType,
            discountValue: original.discountValue,
            discountAmount: original.discountAmount,
            total: original.total,
            notes: original.notes,
            terms: original.terms,
            template: original.template,
            isRecurring: false,
            items: {
              create: original.items.map((it) => ({
                name: it.name,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                total: it.total,
                order: it.order,
              })),
            },
          },
        });

        await tx.invoice.update({
          where: { id: original.id },
          data: { recurringNext: advanceDate(now, cycle) },
        });

        created.push(newInvoice.id);
      });

      const client = await prisma.client.findUnique({ where: { id: original.clientId } });
      await notificationService.create(original.userId, {
        type: "RECURRING_GENERATED",
        title: "Invoice Berulang Dibuat",
        message: `Invoice baru untuk ${client?.name ?? "klien"} telah digenerate otomatis`,
        link: `/invoices/${created[created.length - 1]}`,
        metadata: { invoiceId: created[created.length - 1], originalId: original.id },
      });
    } catch (e) {
      errors.push({
        invoiceId: original.id,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    data: { created: created.length, errors, runAt: now.toISOString() },
  });
}
