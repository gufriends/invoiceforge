import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { notificationService } from "@/services/notification.service";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "@/types/api-requests";

async function recalcInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true, client: true },
  });
  if (!invoice) return;

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const prevStatus = invoice.status;
  let status = invoice.status;
  if (totalPaid <= 0) {
    status = invoice.sentAt ? "SENT" : "DRAFT";
    if (invoice.dueDate < new Date() && status === "SENT") status = "OVERDUE";
  } else if (totalPaid >= invoice.total) {
    status = "PAID";
  } else {
    status = "PARTIAL";
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount: totalPaid, status },
  });

  if (status !== prevStatus) {
    const amountFmt = `Rp ${invoice.total.toLocaleString("id-ID")}`;
    if (status === "PAID") {
      await notificationService.create(invoice.userId, {
        type: "INVOICE_PAID",
        title: "Invoice Lunas",
        message: `${invoice.invoiceNumber} dari ${invoice.client.name} telah lunas (${amountFmt})`,
        link: `/invoices/${invoice.id}`,
        metadata: { invoiceId: invoice.id },
      });
    } else if (status === "PARTIAL") {
      const paidFmt = `Rp ${totalPaid.toLocaleString("id-ID")}`;
      await notificationService.create(invoice.userId, {
        type: "PAYMENT_RECEIVED",
        title: "Pembayaran Diterima",
        message: `${invoice.invoiceNumber} — ${paidFmt} dari ${amountFmt} sudah dibayar`,
        link: `/invoices/${invoice.id}`,
        metadata: { invoiceId: invoice.id },
      });
    }
  }
}

export const paymentService = {
  async create(userId: string, data: CreatePaymentRequest) {
    const invoice = await prisma.invoice.findFirst({ where: { id: data.invoiceId, userId } });
    if (!invoice) throw new ApiError("INVOICE_NOT_FOUND", "Invoice tidak ditemukan", 404);

    const remaining = invoice.total - invoice.paidAmount;
    if (data.amount > remaining + 0.01) {
      throw new ApiError(
        "AMOUNT_EXCEEDS",
        `Jumlah pembayaran melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`,
        400
      );
    }
    if (data.amount <= 0) {
      throw new ApiError("INVALID_AMOUNT", "Jumlah pembayaran harus lebih dari 0", 400);
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        date: new Date(data.date),
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    await recalcInvoiceStatus(data.invoiceId);
    return payment;
  },

  async update(userId: string, id: string, data: UpdatePaymentRequest) {
    const payment = await prisma.payment.findFirst({
      where: { id, invoice: { userId } },
      include: { invoice: true },
    });
    if (!payment) throw new ApiError("NOT_FOUND", "Pembayaran tidak ditemukan", 404);

    if (typeof data.amount === "number") {
      const otherPaid = payment.invoice.paidAmount - payment.amount;
      const remaining = payment.invoice.total - otherPaid;
      if (data.amount > remaining + 0.01) {
        throw new ApiError(
          "AMOUNT_EXCEEDS",
          `Jumlah pembayaran melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`,
          400
        );
      }
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.method !== undefined ? { method: data.method } : {}),
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(data.reference !== undefined ? { reference: data.reference || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
    });

    await recalcInvoiceStatus(payment.invoiceId);
    return updated;
  },

  async delete(userId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, invoice: { userId } },
    });
    if (!payment) throw new ApiError("NOT_FOUND", "Pembayaran tidak ditemukan", 404);

    await prisma.payment.delete({ where: { id } });
    await recalcInvoiceStatus(payment.invoiceId);
  },
};