import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "INVOICE_OVERDUE"
  | "INVOICE_PAID"
  | "INVOICE_VIEWED"
  | "RECURRING_GENERATED"
  | "PAYMENT_RECEIVED";

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async list(userId: string, opts: { limit?: number; cursor?: string; unreadOnly?: boolean } = {}) {
    const { limit = 20, cursor, unreadOnly = false } = opts;
    const where = {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor, hasMore };
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  async markAsRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async create(userId: string, input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: (input.metadata ?? {}) as Record<string, string>,
      },
    });
  },

  async hasOverdueNotification(userId: string, invoiceId: string) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "INVOICE_OVERDUE",
        metadata: { path: ["invoiceId"], equals: invoiceId },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!existing) return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return existing.createdAt > sevenDaysAgo;
  },
};
