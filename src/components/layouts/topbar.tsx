"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Moon, Sun, Search } from "lucide-react";
import { NotificationDropdown } from "@/components/layouts/notification-dropdown";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  invoices: "Invoice",
  clients: "Klien",
  analytics: "Analitik",
  reports: "Laporan",
  settings: "Pengaturan",
  create: "Buat Baru",
  edit: "Edit",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const isId = /^[a-z0-9-]{20,}$/i.test(seg) || seg === "[id]";
    const label = ROUTE_LABELS[seg] ?? (isId ? "Detail" : seg);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });
}

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => setMounted(true), []);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center gap-2 px-4 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b shadow-[0_1px_0_0_var(--border)]"
          : "bg-background"
      }`}
    >
      <SidebarTrigger className="-ml-1 h-8 w-8" />
      <Separator orientation="vertical" className="h-4" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb) => (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Cmd+K search trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex h-8 gap-2 px-3 text-muted-foreground text-xs font-normal border border-border/60 bg-muted/30 hover:bg-muted/60"
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
            )
          }
        >
          <Search className="h-3.5 w-3.5" />
          <span>Cari...</span>
          <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <NotificationDropdown />
      </div>
    </header>
  );
}
