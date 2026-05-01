"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("APP_ERROR", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Ada yang tidak beres</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Terjadi kesalahan di aplikasi. Silakan coba lagi atau kembali ke beranda.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard"><Home className="mr-2 h-4 w-4" /> Beranda</Link>
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}
