"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types/component-props";

export function EmptyState({ icon: Icon, illustration, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {illustration ? (
        <img src={illustration} alt="" className="w-48 h-48 mb-4 opacity-80" />
      ) : Icon ? (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </motion.div>
  );
}
