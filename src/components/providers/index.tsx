"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children, defaultTheme }: { children: React.ReactNode; defaultTheme?: string }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme={defaultTheme}>
        <TooltipProvider>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}