import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsCardProps } from "@/types/component-props";

const variantStyles: Record<NonNullable<StatsCardProps["variant"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-orange-500/10 text-orange-600",
  danger: "bg-red-500/10 text-red-600",
  info: "bg-cyan-500/10 text-cyan-600",
};

export function StatsCard({ title, value, change, changeLabel, icon: Icon, variant = "default", onClick, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn("transition hover:shadow-md", onClick && "cursor-pointer hover:scale-[1.01]")}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {typeof change === "number" && (
              <div className="flex items-center gap-1 text-xs">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
