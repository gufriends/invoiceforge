"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, LayoutDashboard, BarChart3, ClipboardList, Settings } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoice", href: "/invoices", icon: FileText },
  { label: "Buat Invoice", href: "/invoices/create", icon: FileText },
  { label: "Klien", href: "/clients", icon: Users },
  { label: "Tambah Klien", href: "/clients/create", icon: Users },
  { label: "Analitik", href: "/analytics", icon: BarChart3 },
  { label: "Laporan", href: "/reports", icon: ClipboardList },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <DialogContent className="p-0 overflow-hidden max-w-lg" showCloseButton={false}>
        <Command>
          <CommandInput placeholder="Cari halaman, invoice, klien..." />
          <CommandList>
            <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
            <CommandGroup heading="Navigasi">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.href} onSelect={() => run(item.href)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
