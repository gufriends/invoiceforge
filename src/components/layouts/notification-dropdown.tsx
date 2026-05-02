"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, Check, CheckCheck, Receipt, CreditCard, Clock, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import type { Notification } from "@/hooks/use-notifications";

const TYPE_ICONS: Record<string, React.ElementType> = {
  INVOICE_PAID: Receipt,
  PAYMENT_RECEIVED: CreditCard,
  INVOICE_OVERDUE: Clock,
  INVOICE_VIEWED: Eye,
  RECURRING_GENERATED: RefreshCw,
};

function NotificationItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const router = useRouter();
  const Icon = TYPE_ICONS[notif.type] ?? Bell;
  const isUnread = !notif.readAt;

  const handleClick = () => {
    if (isUnread) onRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        isUnread && "bg-primary/5"
      )}
    >
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-sm leading-tight truncate", isUnread ? "font-medium" : "text-muted-foreground")}>
            {notif.title}
          </p>
          {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: localeId })}
        </p>
      </div>
    </button>
  );
}

export function NotificationDropdown() {
  const { data } = useNotifications();
  const unreadCount = useUnreadCount().data ?? 0;
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">
            Notifikasi
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                {unreadCount} baru
              </span>
            )}
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Baca semua
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[380px]">
            <div className="divide-y divide-border/50">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={(id) => markAsRead.mutate(id)} />
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Lihat semua notifikasi
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
