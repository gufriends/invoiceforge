"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-sans",
              },
            }}
          />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}