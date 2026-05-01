import { CheckCircle2, FileText, Send, Eye, XCircle, Wallet, Edit3 } from "lucide-react";
import { formatDateTime } from "@/utils/format-date";
import type { ActivityTimelineProps } from "@/types/component-props";

const ICON_MAP = {
  CREATED: FileText,
  SENT: Send,
  VIEWED: Eye,
  PAID: CheckCircle2,
  PARTIAL: Wallet,
  CANCELLED: XCircle,
  UPDATED: Edit3,
} as const;

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>;
  }
  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {events.map((e) => {
        const Icon = ICON_MAP[e.type];
        return (
          <li key={e.id} className="ml-6">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-3 w-3" />
            </span>
            <p className="text-sm font-medium">{e.description}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(e.timestamp)}</p>
          </li>
        );
      })}
    </ol>
  );
}