import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { InvoiceStatus, Currency, InvoiceTemplate } from "@/lib/constants";
import type { InvoiceWithRelations, InvoiceListItem } from "./invoice";
import type { Client, ClientWithStats } from "./client";
import type { Payment } from "./payment";
import type { Company } from "./company";
import type { InvoiceItemFormOutput } from "./forms";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
  loading?: boolean;
}

export interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md" | "lg";
}

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: Currency;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  presets?: boolean;
  className?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  selection?: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    getRowId: (row: T) => string;
  };
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  bulkActions?: ReactNode;
}

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithRelations;
  onSuccess?: () => void;
}

export interface ClientSelectProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface ItemEditorProps {
  items: InvoiceItemFormOutput[];
  onChange: (items: InvoiceItemFormOutput[]) => void;
  currency?: Currency;
  disabled?: boolean;
}

export interface InvoicePreviewProps {
  invoice: InvoiceWithRelations;
  company: Company;
  template: InvoiceTemplate;
  className?: string;
}

export interface InvoiceTemplateCardProps {
  template: InvoiceTemplate;
  selected: boolean;
  onSelect: () => void;
}

export interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type: "CREATED" | "SENT" | "VIEWED" | "PAID" | "CANCELLED" | "UPDATED" | "PARTIAL";
  description: string;
  timestamp: Date;
}

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export interface TopbarProps {
  className?: string;
}