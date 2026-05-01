# InvoiceForge — Component Library Documentation

Dokumen ini mendefinisikan **kontrak** seluruh custom component InvoiceForge: props, state, event, accessibility, dan contoh penggunaan.

> Lokasi: `src/components/custom/*` (custom), `src/components/ui/*` (shadcn base — tidak didokumentasikan di sini, lihat shadcn docs).

---

## Daftar Isi
1. [Konvensi Umum](#konvensi-umum)
2. [Layout Components](#layout-components)
3. [Data Display](#data-display)
4. [Form & Input](#form--input)
5. [Invoice-specific](#invoice-specific)
6. [Charts](#charts)
7. [Feedback & Status](#feedback--status)
8. [Navigation](#navigation)

---

## Konvensi Umum

### Tipe ref forwarding
Semua component yang membungkus elemen DOM utama harus pakai `forwardRef`:

```tsx
const Component = React.forwardRef<HTMLDivElement, ComponentProps>((props, ref) => {
  return <div ref={ref} {...props} />;
});
Component.displayName = "Component";
```

### Naming
- **PascalCase** untuk component file & nama (mis. `InvoicePreview.tsx`).
- **kebab-case** untuk path component file (kompromi shadcn convention): `invoice-preview.tsx`.
- Hooks: `use-foo.ts` → `useFoo`.

### Variants
Pakai `class-variance-authority` (CVA) untuk variant:

```tsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
```

### Accessibility checklist (WCAG 2.1 AA)
- Semua interactive harus reachable via keyboard (Tab/Shift+Tab).
- Focus ring jelas (≥ 3:1 contrast).
- ARIA labels untuk icon-only buttons.
- `aria-live` untuk dynamic content (toast, error).
- Form input wajib `<label>` (visible atau `sr-only`).

### Dark mode
Pakai semantic Tailwind tokens (`bg-background`, `text-foreground`) — bukan `bg-white`. Theme di-toggle via `next-themes`.

---

## Layout Components

### `<AppLayout>`
Layout utama untuk halaman authenticated. Mengandung sidebar + topbar + content area.

**Path:** `src/components/layouts/app-layout.tsx`

```ts
export interface AppLayoutProps {
  children: React.ReactNode;
  /** Tampilkan breadcrumb di topbar */
  breadcrumb?: React.ReactNode;
  /** Title dokumen (untuk tab browser) */
  title?: string;
}
```

**State**
- `sidebar.collapsed` (Zustand `useSidebarStore`).
- `theme` (next-themes).

**A11y**
- Sidebar `<nav aria-label="Navigasi utama">`.
- Skip-to-content link visible saat focus.

**Usage**
```tsx
<AppLayout title="Dashboard">
  <DashboardPage />
</AppLayout>
```

---

### `<Sidebar>`

**Path:** `src/components/layouts/sidebar.tsx`

```ts
export interface SidebarProps {
  /** Custom items override (default: ITEMS dari constants) */
  items?: SidebarItem[];
  /** Mobile drawer mode */
  mode?: "static" | "drawer";
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  match?: "exact" | "startsWith";
}
```

**State**
- `collapsed: boolean` — controlled via `useSidebarStore`.
- Active item — derive dari `usePathname()`.

**Event handlers**
- `onCollapseToggle()` — toggle width 64px ↔ 240px.
- `onItemClick(href)` — auto-close drawer di mobile.

**A11y**
- `<nav aria-label="Sidebar">`.
- Active item `aria-current="page"`.

**Usage**
```tsx
<Sidebar
  items={[
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Invoices", href: "/invoices", icon: FileText, badge: 3 },
  ]}
/>
```

---

### `<Topbar>`

**Path:** `src/components/layouts/topbar.tsx`

```ts
export interface TopbarProps {
  breadcrumb?: React.ReactNode;
  /** Search disable di halaman tertentu */
  showSearch?: boolean;
}
```

**Sub-components:**
- `<GlobalSearch />` — command palette (cmdk-based, Ctrl+K).
- `<NotificationBell />` — lihat di bagian Feedback.
- `<ThemeToggle />` — light/dark/system.
- `<UserMenu />` — avatar dropdown (profile, settings, logout).

---

### `<AuthLayout>`
Layout untuk halaman public auth (`/login`, `/register`).

```ts
export interface AuthLayoutProps {
  children: React.ReactNode;
  /** Title card */
  heading?: string;
  /** Subheading */
  description?: string;
  /** Footer link (mis. "Belum punya akun? Daftar") */
  footer?: React.ReactNode;
}
```

**Layout:** Two-column. Kiri: gradient illustration. Kanan: card 400px max-width.

---

## Data Display

### `<DataTable<T>>`
Generic table dengan sort, filter, pagination, selection.

**Path:** `src/components/custom/data-table.tsx`

```ts
import type { ColumnDef, SortingState } from "@tanstack/react-table";

export interface DataTableProps<T> {
  /** Data rows */
  data: T[];
  /** Column definitions (TanStack Table) */
  columns: ColumnDef<T, any>[];

  /** Pagination */
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };

  /** Sorting */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  /** Global search (debounced 300ms) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Row selection */
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowId?: (row: T) => string;

  /** Bulk actions */
  bulkActions?: Array<{
    label: string;
    icon?: LucideIcon;
    onClick: (selectedIds: string[]) => void | Promise<void>;
    variant?: "default" | "destructive";
    confirm?: string;
  }>;

  /** Loading & empty states */
  isLoading?: boolean;
  emptyState?: React.ReactNode;

  /** Row actions */
  onRowClick?: (row: T) => void;

  /** Export */
  onExport?: (rows: T[]) => void;

  /** Densitas */
  density?: "compact" | "default" | "comfortable";

  /** Sticky header */
  stickyHeader?: boolean;
}
```

**State internal**
- `columnVisibility` — toggle kolom (persisted ke localStorage `dt-{tableId}-visibility`).
- `density` — persisted juga.

**Event handlers**
- Sort: klik header → cycle `asc → desc → none`.
- Select all: checkbox di header.
- Pagination: previous/next/jump.

**A11y**
- `<table role="table">` dengan `<th scope="col">`.
- Keyboard nav: Arrow keys di table cells (mode opt-in via `keyboardNavigation`).
- Sort button: `aria-sort="ascending|descending|none"`.

**Usage**
```tsx
<DataTable<Invoice>
  data={invoices}
  columns={invoiceColumns}
  pagination={{ pageIndex, pageSize, total, onPageChange }}
  sorting={sorting}
  onSortingChange={setSorting}
  selectable
  bulkActions={[
    { label: "Tandai sudah dikirim", icon: Send, onClick: handleBulkSend },
    { label: "Hapus", icon: Trash, onClick: handleBulkDelete, variant: "destructive", confirm: "Yakin?" },
  ]}
  onRowClick={(row) => router.push(`/invoices/${row.id}`)}
/>
```

---

### `<StatsCard>`
Kartu metrik dashboard.

**Path:** `src/components/custom/stats-card.tsx`

```ts
export interface StatsCardProps {
  title: string;
  value: string | number;
  /** Format value sebagai currency / number / percent */
  format?: "currency" | "number" | "percent" | "raw";
  currency?: string; // default IDR
  /** Perubahan vs periode sebelumnya, dalam rasio (0.125 = +12.5%) */
  change?: number;
  /** Label perubahan (default: "vs bulan lalu") */
  changeLabel?: string;
  /** Icon di kanan */
  icon?: LucideIcon;
  /** Variant warna */
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  /** Klik card */
  href?: string;
  onClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Helper text di bawah */
  description?: string;
}
```

**Behavior**
- `change > 0` → ▲ hijau, `change < 0` → ▼ merah, `0` → netral.
- Animasi count-up saat value berubah (Framer Motion).
- Skeleton saat `isLoading`.

**A11y**
- Card sebagai `<a>` jika `href`, sebagai `<button>` jika `onClick`. Default `<div>` non-interactive.

**Usage**
```tsx
<StatsCard
  title="Pendapatan"
  value={45200000}
  format="currency"
  change={0.125}
  changeLabel="vs bulan lalu"
  icon={DollarSign}
  variant="success"
  href="/analytics"
/>
```

---

### `<ActivityTimeline>`
Vertical timeline event invoice.

**Path:** `src/components/custom/activity-timeline.tsx`

```ts
export interface ActivityTimelineProps {
  items: ActivityItem[];
  /** Maksimal item ditampilkan; sisanya "lihat selengkapnya" */
  maxItems?: number;
}

export interface ActivityItem {
  id: string;
  type: InvoiceActivityType;
  title: string;
  description?: string;
  timestamp: string | Date;
  actor?: { name: string; avatar?: string };
}
```

**A11y**
- `<ol>` semantik dengan `<time datetime="...">`.

---

### `<EmptyState>`

**Path:** `src/components/custom/empty-state.tsx`

```ts
export interface EmptyStateProps {
  /** Path SVG illustration (di /public/images/empty-*.svg) */
  illustration?: string;
  /** Atau React element */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  size?: "sm" | "md" | "lg";
}
```

**Usage**
```tsx
<EmptyState
  illustration="/images/empty-invoices.svg"
  title="Belum ada invoice"
  description="Buat invoice pertama Anda untuk mulai mengelola pembayaran."
  action={{ label: "+ Buat Invoice", href: "/invoices/create" }}
/>
```

---

## Form & Input

### `<CurrencyInput>`
Input numerik dengan format currency Indonesia.

**Path:** `src/components/custom/currency-input.tsx`

```ts
export interface CurrencyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Default IDR */
  currency?: "IDR" | "USD" | "SGD" | "MYR" | "EUR";
  /** Max digit (default 15) */
  maxDigits?: number;
  /** Placeholder */
  placeholder?: string;
  /** Disable input */
  disabled?: boolean;
  /** Allow negative */
  allowNegative?: boolean;
  /** Decimal places (IDR=0, USD=2) */
  decimals?: number;
  /** Class tambahan */
  className?: string;
  /** ID untuk label */
  id?: string;
  /** ARIA label */
  "aria-label"?: string;
  /** ARIA describedby */
  "aria-describedby"?: string;
  /** Error state */
  error?: boolean;
  /** Auto-focus */
  autoFocus?: boolean;
  /** Event */
  onBlur?: () => void;
}
```

**Behavior**
- Saat ketik: `12500000` → ditampilkan `Rp 12.500.000`.
- Saat focus: tampilkan raw number (mudah diedit). Saat blur: format ulang.
- Symbol `Rp ` / `$ ` sebagai prefix non-editable.

**State internal**
- `displayValue: string` — formatted untuk UI.
- `isFocused: boolean`.

**A11y**
- `inputmode="numeric"` di mobile.
- `aria-invalid={error}`.

**Usage**
```tsx
<CurrencyInput
  value={amount}
  onChange={setAmount}
  currency="IDR"
  placeholder="Masukkan jumlah"
/>
```

---

### `<DateRangePicker>`

**Path:** `src/components/custom/date-range-picker.tsx`

```ts
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Label preset Indonesia */
  presets?: Array<"today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "custom">;
  /** Min/max tanggal yang boleh dipilih */
  minDate?: Date;
  maxDate?: Date;
  /** Locale (default id-ID) */
  locale?: string;
  /** Placeholder ketika kosong */
  placeholder?: string;
  /** Allow null (clear) */
  clearable?: boolean;
  align?: "start" | "center" | "end";
}
```

**Behavior**
- Default presets: 7 hari, 30 hari, bulan ini, kuartal ini, tahun ini, custom.
- Format display: `01 Apr - 30 Apr 2026`.
- Locale `id-ID`: bulan dalam bahasa Indonesia.

---

### `<ClientSelect>`
Searchable dropdown untuk memilih client.

**Path:** `src/components/custom/client-select.tsx`

```ts
export interface ClientSelectProps {
  value: string | null; // clientId
  onChange: (clientId: string | null) => void;
  /** Allow inline create */
  allowCreate?: boolean;
  /** Callback saat user pilih "Tambah klien baru" */
  onCreateNew?: (input: string) => void;
  /** Disable */
  disabled?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** Error state */
  error?: boolean;
}
```

**Behavior**
- Search debounce 300ms → call `useClients({ q })`.
- Tampilkan: nama + company + email.
- Footer dropdown: "+ Tambah klien baru" jika `allowCreate`.

**A11y**
- Combobox pattern (Radix `<Combobox>`).

**Usage**
```tsx
<ClientSelect
  value={form.watch("clientId")}
  onChange={(id) => form.setValue("clientId", id)}
  allowCreate
  onCreateNew={(name) => openCreateClientDialog({ name })}
/>
```

---

### `<ItemEditor>`
Editable table untuk invoice items.

**Path:** `src/components/custom/item-editor.tsx`

```ts
export interface InvoiceItemDraft {
  id?: string; // optional, ada saat edit
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount: number;
  taxable: boolean;
}

export interface ItemEditorProps {
  value: InvoiceItemDraft[];
  onChange: (items: InvoiceItemDraft[]) => void;
  currency?: string;
  /** Disable taxable toggle (jika company bukan PKP) */
  disableTaxable?: boolean;
  /** Read-only (untuk preview) */
  readOnly?: boolean;
  /** Error per item (dari Zod) */
  errors?: Record<number, Record<string, string>>;
}
```

**Internal handlers**
- `addItem()` — append empty item.
- `removeItem(index)`.
- `updateItem(index, patch)`.
- `reorderItems(from, to)` — drag & drop (dnd-kit).

**Computed**
- `lineTotal = quantity * unitPrice * (1 - discount/100)`.

**A11y**
- Drag handle: `<button aria-label="Pindahkan item">`.
- Delete: `<button aria-label={`Hapus ${item.name}`}>`.

---

### `<SearchInput>`

**Path:** `src/components/custom/search-input.tsx`

```ts
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce ms (default 300) */
  debounce?: number;
  /** Show clear button */
  clearable?: boolean;
  /** Tampilkan icon search di kiri */
  showIcon?: boolean;
  /** Auto-focus */
  autoFocus?: boolean;
  className?: string;
}
```

**Behavior**
- Internal state `inputValue` terpisah dari `value` (debounce).
- Trigger `onChange` setelah delay.

---

### `<ColorPicker>`
Picker warna untuk theme primaryColor.

```ts
export interface ColorPickerProps {
  value: string; // hex
  onChange: (hex: string) => void;
  /** Preset palette */
  presets?: string[];
  /** Allow custom */
  allowCustom?: boolean;
}
```

---

### Form fields hooked to `react-hook-form`

InvoiceForge menggunakan **shadcn `<Form>` wrapper** (`<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`). Custom inputs di atas semua kompatibel dengan `Controller`:

```tsx
<FormField
  control={form.control}
  name="amount"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Jumlah</FormLabel>
      <FormControl>
        <CurrencyInput {...field} error={!!fieldState.error} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Invoice-specific

### `<InvoiceStatusBadge>`

**Path:** `src/components/custom/invoice-status-badge.tsx`

```ts
export interface InvoiceStatusBadgeProps {
  status: InvoiceStatus; // "DRAFT" | "SENT" | ...
  size?: "sm" | "md" | "lg";
  /** Tampilkan icon */
  withIcon?: boolean;
  /** Tampilkan dot saja (compact) */
  variant?: "filled" | "outline" | "soft" | "dot";
}
```

**Mapping**
| Status | Color | Icon |
|--------|-------|------|
| DRAFT | gray | `FileEdit` |
| SENT | blue | `Send` |
| VIEWED | cyan | `Eye` |
| PARTIAL | amber | `CircleDollarSign` |
| PAID | green | `CheckCircle` |
| OVERDUE | red | `AlertTriangle` |
| CANCELLED | slate (strikethrough) | `XCircle` |

**Usage**
```tsx
<InvoiceStatusBadge status="OVERDUE" withIcon />
```

---

### `<InvoicePreview>`
Live preview invoice.

**Path:** `src/components/custom/invoice-preview.tsx`

```ts
export interface InvoicePreviewProps {
  /** Data invoice (bisa partial saat editing) */
  invoice: Partial<InvoiceWithRelations>;
  /** Override company info (untuk preview tanpa fetch) */
  company: Company;
  /** Template */
  template: "MODERN" | "CLASSIC" | "MINIMAL";
  /** Skala (0.5 = 50% untuk thumbnail) */
  scale?: number;
  /** Mode print (sembunyikan tombol/UI editor) */
  print?: boolean;
}
```

**Layout (Modern):**
- Header: logo kiri, "INVOICE" + nomor kanan.
- Info bar: Bill To (kiri), tanggal & due (kanan).
- Items table.
- Totals box.
- Notes & terms.
- Footer: bank info.

**A11y** — Visual-only di UI; PDF generated via `@react-pdf/renderer` (separate components, lihat `lib/pdf/`).

---

### `<InvoiceTemplateCard>`
Pemilihan template di create/edit invoice.

```ts
export interface InvoiceTemplateCardProps {
  template: "MODERN" | "CLASSIC" | "MINIMAL";
  selected: boolean;
  onSelect: () => void;
  /** Path thumbnail di /public */
  thumbnail: string;
}
```

**A11y** — `role="radio"`, kelompokkan dalam `role="radiogroup"`.

---

### `<PaymentDialog>`
Dialog modal untuk merekam pembayaran.

```ts
export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: { id: string; balanceDue: number; currency: string; invoiceNumber: string };
  /** Callback setelah berhasil simpan */
  onSuccess?: (payment: Payment) => void;
  /** Edit mode */
  payment?: Payment;
}
```

**Form fields:**
- Amount (CurrencyInput, default = `balanceDue`, max = `balanceDue`)
- Method (Select)
- Date (Calendar)
- Reference (Input)
- Notes (Textarea)
- Attachment upload (optional)

---

### `<InvoiceForm>`
Form create/edit invoice (multi-section).

```ts
export interface InvoiceFormProps {
  /** Default values (untuk edit) */
  defaultValues?: InvoiceFormValues;
  /** Mode */
  mode: "create" | "edit";
  /** Invoice ID (untuk edit) */
  invoiceId?: string;
  /** Submit handler */
  onSubmit: (values: InvoiceFormValues) => void | Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Show preview panel */
  showPreview?: boolean;
}

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
```

**Sections** (rendered as collapsible accordion di mobile, side-by-side di desktop):
1. Invoice Info (number, dates, template)
2. Client (ClientSelect + preview)
3. Items (ItemEditor)
4. Totals & Adjustments (discount, tax, shipping)
5. Notes & Terms (textareas)
6. Recurring (toggle + cycle)

**Side panel (≥ lg):** `<InvoicePreview>` live preview.

**Behavior**
- Auto-save draft setiap 30 detik (jika ada perubahan).
- Form validation dengan Zod, error inline.
- Hot-keys: `Cmd+S` save, `Esc` cancel.

---

## Charts

Built on **Recharts**. Wrapper kustom untuk theming + responsive.

### `<RevenueChart>`

**Path:** `src/components/charts/revenue-chart.tsx`

```ts
export interface RevenueChartProps {
  data: Array<{ period: string; revenue: number; invoices?: number; paid?: number }>;
  /** Toggle metric */
  metric?: "revenue" | "invoices";
  /** Height */
  height?: number;
  /** Hide legend */
  hideLegend?: boolean;
  /** Currency utk format tooltip */
  currency?: string;
  /** Klik bar/dot */
  onPointClick?: (point: { period: string; value: number }) => void;
}
```

**Implementation**
- AreaChart dengan gradient fill (`<defs><linearGradient>`).
- Tooltip custom: format currency + perbandingan.
- Responsive via `<ResponsiveContainer>`.

---

### `<StatusDistributionChart>`
Donut chart distribusi status invoice.

```ts
export interface StatusDistributionChartProps {
  data: Array<{ status: InvoiceStatus; count: number; amount: number }>;
  /** Show legend */
  showLegend?: boolean;
  /** Klik segment */
  onStatusClick?: (status: InvoiceStatus) => void;
}
```

**A11y** — fallback table tersedia di balik `<details>` (toggle "lihat data").

---

### `<TopClientsChart>`
Horizontal bar chart top N clients.

```ts
export interface TopClientsChartProps {
  data: Array<{ client: { id: string; name: string }; revenue: number; invoices: number }>;
  /** Top N (default 10) */
  limit?: number;
  /** Klik bar → navigate ke client detail */
  onClientClick?: (clientId: string) => void;
}
```

---

### `<PaymentMethodChart>`
Pie chart distribusi metode pembayaran.

```ts
export interface PaymentMethodChartProps {
  data: Array<{ method: PaymentMethod; count: number; amount: number }>;
}
```

---

## Feedback & Status

### `<NotificationBell>`

**Path:** `src/components/custom/notification-bell.tsx`

```ts
export interface NotificationBellProps {
  /** Override default fetcher (untuk testing) */
  notifications?: Notification[];
  /** Klik notif */
  onNotificationClick?: (notif: Notification) => void;
}
```

**State**
- Pakai `useNotifications()` hook → polling 60 detik.
- `unreadCount` dari meta.
- Mark-as-read on click.

**A11y**
- `<button aria-label="Notifikasi">` dengan badge `<span aria-label="X notifikasi belum dibaca">`.
- Popover content `role="dialog"`.

---

### `<ConfirmDialog>`
Generic confirmation dialog.

```ts
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  /** Loading saat onConfirm berjalan */
  loading?: boolean;
}
```

---

### `<LoadingSkeleton>`
Helper untuk skeleton patterns umum.

```ts
export interface LoadingSkeletonProps {
  variant: "table" | "card" | "list" | "form" | "chart" | "stats";
  /** Berapa baris */
  rows?: number;
}
```

**Usage**
```tsx
{isLoading ? <LoadingSkeleton variant="table" rows={5} /> : <DataTable ... />}
```

---

### `<ErrorBoundary>`
Class component untuk catch render error.

```ts
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Log ke Sentry */
  logError?: boolean;
}
```

---

### Toast (sonner)
Pakai `sonner` (`<Toaster />` di root). Helper:

```ts
import { toast } from "sonner";

toast.success("Invoice berhasil dibuat");
toast.error("Gagal menyimpan", { description: "Coba lagi nanti" });
toast.promise(savePromise, {
  loading: "Menyimpan...",
  success: "Tersimpan",
  error: "Gagal",
});
```

---

## Navigation

### `<Breadcrumb>`

```ts
export interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
  /** Separator (default ChevronRight) */
  separator?: React.ReactNode;
}
```

**A11y** — `<nav aria-label="Breadcrumb">`, item terakhir `aria-current="page"`.

---

### `<Pagination>`
Standalone pagination (juga dipakai di DataTable).

```ts
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Tampilkan jump-to-first/last */
  showJumpButtons?: boolean;
  /** Tampilkan info "1-20 dari 142" */
  showInfo?: boolean;
}
```

---

### `<Tabs>` (shadcn extended)
Pakai shadcn dengan styling kustom. Mendukung URL-sync via query param:

```tsx
<Tabs value={tab} onValueChange={(v) => router.replace(`?tab=${v}`)}>
```

---

## Type definitions ringkasan

```ts
// src/types/components.ts
export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "E_WALLET" | "QRIS" | "CREDIT_CARD" | "CHEQUE" | "OTHER";
export type InvoiceTemplate = "MODERN" | "CLASSIC" | "MINIMAL";
export type DiscountType = "PERCENTAGE" | "FIXED";
export type RecurringCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type InvoiceActivityType =
  | "CREATED" | "UPDATED" | "SENT" | "VIEWED" | "REMINDED"
  | "PAYMENT_RECEIVED" | "PAID" | "OVERDUE" | "CANCELLED" | "DELETED" | "PDF_GENERATED" | "DUPLICATED";
```

---

## Testing components

Setiap custom component **harus** punya tests minimal:
- Render dengan props default → tidak crash.
- Trigger primary action → callback ter-call dengan args benar.
- Variant (mis. `variant="destructive"`) → kelas/style berbeda.
- A11y — `axe` zero violation.

Contoh:

```tsx
// item-editor.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemEditor } from "./item-editor";

it("menambah item ketika tombol 'Tambah Item' diklik", async () => {
  const onChange = vi.fn();
  render(<ItemEditor value={[]} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: /tambah item/i }));
  expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: "" })]);
});
```

Lihat `docs/TESTING.md` untuk strategi lengkap.
