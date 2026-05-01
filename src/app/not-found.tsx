import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard"><Home className="mr-2 h-4 w-4" /> Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
