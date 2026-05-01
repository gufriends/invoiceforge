"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/reports", label: "Laporan", icon: ClipboardList },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-lg">InvoiceForge</span>
          </Link>
        </div>
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
