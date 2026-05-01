import { create } from "zustand";
import type { NotificationStore } from "@/types/store";

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) =>
    set((s) => {
      const item = {
        ...n,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        read: false,
      };
      return {
        notifications: [item, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      };
    }),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  remove: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));