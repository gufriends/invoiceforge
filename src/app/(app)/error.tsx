"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("APP_GROUP_ERROR", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">Halaman bermasalah</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{error.message || "Terjadi kesalahan saat memuat halaman ini"}</p>
      <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" /> Muat Ulang</Button>
    </div>
  );
}
