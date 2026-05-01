"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInputFocused) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "k") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder*="Cari"]');
        search?.focus();
        return;
      }
      if (e.key === "g") {
        const next = (path: string) => router.push(path);
        const sub = (e2: KeyboardEvent) => {
          if (e2.key === "d") next("/dashboard");
          else if (e2.key === "i") next("/invoices");
          else if (e2.key === "c") next("/clients");
          else if (e2.key === "a") next("/analytics");
          else if (e2.key === "r") next("/reports");
          else if (e2.key === "s") next("/settings");
          window.removeEventListener("keydown", sub);
        };
        window.addEventListener("keydown", sub, { once: true });
      }
      if (e.key === "n" && !ctrl) {
        e.preventDefault();
        if (window.location.pathname.includes("/invoices")) router.push("/invoices/create");
        else if (window.location.pathname.includes("/clients")) router.push("/clients/create");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
