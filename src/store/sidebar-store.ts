import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SidebarStore } from "@/types/store";

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    { name: "sidebar-storage", partialize: (s) => ({ collapsed: s.collapsed }) }
  )
);