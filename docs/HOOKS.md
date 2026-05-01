# InvoiceForge — Custom Hooks Documentation

Dokumen ini mendefinisikan **kontrak** seluruh custom hook InvoiceForge. Hook adalah lapisan utama integrasi data antara UI dan API.

> Lokasi: `src/hooks/*.ts`

---

## Daftar Isi
1. [Konvensi Umum](#konvensi-umum)
2. [Cache Strategy](#cache-strategy)
3. [Query Hooks](#query-hooks)
4. [Mutation Hooks](#mutation-hooks)
5. [Utility Hooks](#utility-hooks)
6. [Subscription / Realtime Hooks](#subscription--realtime-hooks)

---

## Konvensi Umum

### Naming
- Hook query: `useFooBar` (mis. `useInvoices`, `useInvoice(id)`).
- Hook mutation: `useCreateFoo`, `useUpdateFoo`, `useDeleteFoo`.
- Hook custom util: `useFooBar` (mis. `useDebounce`, `useMediaQuery`).

### Query keys
Sentralisasi key di `src/hooks/query-keys.ts`:

```ts
export const queryKeys = {
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...queryKeys.invoices.all, "list"] as const,
    list: (filters: InvoiceListFilters) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    stats: () => [...queryKeys.invoices.all, "stats"] as const,
    nextNumber: () => [...queryKeys.invoices.all, "next-number"] as const,
  },
  clients: {
    all: ["clients"] as const,
    lists: () => [...queryKeys.clients.all, "list"] as const,
    list: (filters: ClientListFilters) => [...queryKeys.clients.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.clients.all, "detail", id] as const,
    stats: (id: string) => [...queryKeys.clients.all, "stats", id] as const,
    invoices: (id: string) => [...queryKeys.clients.all, "invoices", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters: PaymentFilters) => [...queryKeys.payments.all, "list", filters] as const,
  },
  company: {
    me: ["company", "me"] as const,
  },
  analytics: {
    overview: (range: AnalyticsRange) => ["analytics", "overview", range] as const,
    revenue: (params: RevenueParams) => ["analytics", "revenue", params] as const,
    clients: (range: AnalyticsRange) => ["analytics", "clients", range] as const,
    invoices: (range: AnalyticsRange) => ["analytics", "invoices", range] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: NotificationParams) => ["notifications", "list", params] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
};
```

### Standard return shape

```ts
// Query hook
export type UseQueryReturn<TData> = {
  data: TData | undefined;
  isLoading: boolean;       // initial load
  isFetching: boolean;      // any fetch including background refetch
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

// Mutation hook
export type UseMutationReturn<TInput, TOutput> = {
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: TOutput | undefined;
  reset: () => void;
};
```

---

## Cache Strategy

### Default config

```ts
// src/lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,         // 1 menit — data dianggap fresh
      gcTime: 5 * 60 * 1000,        // 5 menit — garbage collect
      retry: (failureCount, error) => {
        // Jangan retry untuk 4xx (client error)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : "Terjadi kesalahan";
        toast.error(message);
      },
    },
  },
});
```

### Per-domain override

| Domain | staleTime | gcTime | refetchInterval | Reason |
|--------|-----------|--------|-----------------|--------|
| `invoices.list` | 30s | 5m | — | Daftar invoice sering berubah |
| `invoices.detail` | 60s | 10m | — | Detail relatif stabil |
| `invoices.stats` | 5m | 30m | — | Stats agregat, mahal di-compute |
| `clients.list` | 5m | 30m | — | Client jarang berubah |
| `company.me` | 10m | 1h | — | Company info hampir tidak berubah |
| `analytics.*` | 5m | 30m | — | Mahal, data tidak realtime critical |
| `notifications.list` | 30s | 5m | 60s | Polling notifikasi |
| `notifications.unreadCount` | 30s | 5m | 60s | Badge realtime |

### Optimistic updates
Pola standar untuk mutation:

```ts
mutationFn: async (input) => api.post("/invoices", input),
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.invoices.lists() });
  const previous = queryClient.getQueriesData({ queryKey: queryKeys.invoices.lists() });
  queryClient.setQueriesData({ queryKey: queryKeys.invoices.lists() }, (old: any) => {
    if (!old) return old;
    return { ...old, data: [{ ...input, id: "tmp-" + Date.now(), status: "DRAFT" }, ...old.data] };
  });
  return { previous };
},
onError: (_err, _input, context) => {
  context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
},
```

### Invalidation rules

| Mutation | Keys to invalidate |
|----------|--------------------|
| createInvoice | `invoices.all`, `analytics.*` |
| updateInvoice(id) | `invoices.detail(id)`, `invoices.lists()`, `analytics.*` |
| deleteInvoice(id) | `invoices.all`, `analytics.*` |
| sendInvoice(id) | `invoices.detail(id)`, `invoices.lists()`, `notifications.*` |
| recordPayment | `invoices.detail(invoiceId)`, `invoices.lists()`, `payments.*`, `analytics.*` |
| createClient | `clients.lists()`, `analytics.clients` |
| updateClient(id) | `clients.detail(id)`, `clients.lists()` |
| deleteClient(id) | `clients.all` |
| updateCompany | `company.me` |

---

## Query Hooks

### `useInvoices(filters?)`

```ts
export interface InvoiceListFilters {
  page?: number;
  perPage?: number;
  q?: string;
  status?: InvoiceStatus[];
  clientId?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sort?: string; // "issueDate:desc"
}

export function useInvoices(filters: InvoiceListFilters = {}): UseQueryReturn<{
  data: Invoice[];
  meta: PaginationMeta;
}>;
```

**Cache:** `staleTime: 30s`, `gcTime: 5m`. Key: `queryKeys.invoices.list(filters)`.

**Behavior**
- `placeholderData: keepPreviousData` — saat ganti page, hold UI sebelumnya.
- `enabled: true` selalu (filters bisa kosong).

**Usage**
```tsx
const { data, isLoading } = useInvoices({ status: ["OVERDUE"], page: 1, perPage: 20 });
```

---

### `useInvoice(id)`

```ts
export function useInvoice(id: string | undefined): UseQueryReturn<InvoiceWithRelations>;
```

**Cache:** `staleTime: 60s`, `gcTime: 10m`. Key: `queryKeys.invoices.detail(id)`.

**Behavior**
- `enabled: !!id`.
- Prefetch saat hover row di table (`useQueryClient().prefetchQuery(...)`).

---

### `useInvoiceStats()`

```ts
export function useInvoiceStats(): UseQueryReturn<InvoiceStats>;

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  byStatus: Record<InvoiceStatus, number>;
  thisMonth: { invoices: number; revenue: number; growthPercent: number };
}
```

**Cache:** `staleTime: 5m`, `gcTime: 30m`.

---

### `useNextInvoiceNumber(year?)`

```ts
export function useNextInvoiceNumber(year?: number): UseQueryReturn<{ invoiceNumber: string }>;
```

**Cache:** `staleTime: 0` — selalu fresh karena bisa berubah cepat.

**Behavior** — auto-refetch saat invoice baru dibuat (via invalidation).

---

### `useClients(filters?)`

```ts
export interface ClientListFilters {
  page?: number;
  perPage?: number;
  q?: string;
  isActive?: boolean;
  tag?: string;
  sort?: string;
}

export function useClients(filters?: ClientListFilters): UseQueryReturn<{
  data: ClientWithStats[];
  meta: PaginationMeta;
}>;
```

**Cache:** `staleTime: 5m`, `gcTime: 30m`. Key: `queryKeys.clients.list(filters)`.

---

### `useClient(id)`

```ts
export function useClient(id: string | undefined): UseQueryReturn<ClientWithStats>;
```

**Cache:** `staleTime: 5m`, `gcTime: 30m`.

---

### `useClientStats(id)`

```ts
export function useClientStats(id: string | undefined): UseQueryReturn<ClientStats>;

export interface ClientStats {
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  averagePaymentDays: number;
  byStatus: Record<InvoiceStatus, number>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}
```

**Cache:** `staleTime: 5m`.

---

### `useClientInvoices(id, filters?)`

```ts
export function useClientInvoices(
  id: string,
  filters?: { page?: number; status?: InvoiceStatus[] }
): UseQueryReturn<{ data: Invoice[]; meta: PaginationMeta }>;
```

---

### `useCompany()`

```ts
export function useCompany(): UseQueryReturn<Company>;
```

**Cache:** `staleTime: 10m`, `gcTime: 1h`. Key: `queryKeys.company.me`.

**Behavior** — preloaded di app layout via SSR/initial data.

---

### `usePayments(filters?)`

```ts
export interface PaymentFilters {
  invoiceId?: string;
  clientId?: string;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export function usePayments(filters?: PaymentFilters): UseQueryReturn<{
  data: Payment[];
  meta: PaginationMeta;
}>;
```

---

### `useAnalyticsOverview(range)`

```ts
export type AnalyticsRange =
  | { preset: "30d" | "90d" | "365d" | "ytd" }
  | { preset: "custom"; from: string; to: string };

export function useAnalyticsOverview(range: AnalyticsRange): UseQueryReturn<AnalyticsOverview>;

export interface AnalyticsOverview {
  range: { from: string; to: string };
  kpi: {
    revenue: KpiMetric;
    invoicesCount: KpiMetric;
    clientsCount: KpiMetric;
    overdueCount: KpiMetric;
    averagePaymentDays: KpiMetric;
  };
}

export interface KpiMetric {
  value: number;
  change: number; // ratio, mis 0.125 = +12.5%
  previousValue?: number;
}
```

**Cache:** `staleTime: 5m`, `gcTime: 30m`.

---

### `useRevenueChart(params)`

```ts
export interface RevenueParams {
  granularity: "day" | "week" | "month";
  range: AnalyticsRange;
}

export function useRevenueChart(params: RevenueParams): UseQueryReturn<{
  granularity: string;
  series: Array<{ period: string; revenue: number; invoices: number; paid: number }>;
}>;
```

---

### `useNotifications(params?)`

```ts
export interface NotificationParams {
  unreadOnly?: boolean;
  page?: number;
  perPage?: number;
}

export function useNotifications(params?: NotificationParams): UseQueryReturn<{
  data: Notification[];
  meta: PaginationMeta & { unreadCount: number };
}>;
```

**Cache:** `staleTime: 30s`, `refetchInterval: 60_000` (polling saat tab aktif).

**Behavior**
- `refetchIntervalInBackground: false` (hemat resource saat tab tidak aktif).

---

### `useUnreadNotificationCount()`

```ts
export function useUnreadNotificationCount(): UseQueryReturn<number>;
```

**Cache:** `staleTime: 30s`, `refetchInterval: 60_000`.

---

### `useMe()`

```ts
export function useMe(): UseQueryReturn<{ user: User; company: Company | null }>;
```

**Cache:** `staleTime: 10m`, `gcTime: 1h`.

---

## Mutation Hooks

### `useCreateInvoice()`

```ts
export function useCreateInvoice(): UseMutationReturn<CreateInvoiceInput, Invoice>;

export interface CreateInvoiceInput {
  clientId: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  items: InvoiceItemInput[];
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  shippingAmount?: number;
  notes?: string;
  terms?: string;
  template?: InvoiceTemplate;
  isRecurring?: boolean;
  recurringCycle?: RecurringCycle;
  status?: "DRAFT" | "SENT";
}
```

**Optimistic update** — Tambah ke list dengan ID temporer.

**On success:**
- Invalidate `invoices.all`, `analytics.*`, `invoices.nextNumber`.
- Toast success.
- Redirect ke `/invoices/:id` (dilakukan di component, bukan hook).

**Error handling**
- Network error → toast generic.
- Validation error → set form errors via `setError`.
- Conflict (invoice number duplikat) → toast spesifik.

---

### `useUpdateInvoice(id)`

```ts
export function useUpdateInvoice(id: string): UseMutationReturn<UpdateInvoiceInput, Invoice>;
```

**Optimistic** — Update detail cache langsung. Rollback on error.

---

### `useDeleteInvoice()`

```ts
export function useDeleteInvoice(): UseMutationReturn<{ id: string; permanent?: boolean }, void>;
```

**Behavior**
- Optimistic remove dari list.
- On confirmation: undo toast 5 detik (untuk DRAFT permanent delete).

---

### `useSendInvoice()`

```ts
export function useSendInvoice(): UseMutationReturn<
  { id: string; payload?: { to?: string[]; cc?: string[]; subject?: string; message?: string; attachPdf?: boolean } },
  { id: string; status: "SENT"; sentAt: string; messageId: string }
>;
```

**No optimistic** — wait server confirmation.

**On success:**
- Invalidate detail + list.
- Toast: "Invoice terkirim ke {client.email}".

---

### `useDuplicateInvoice()`

```ts
export function useDuplicateInvoice(): UseMutationReturn<{ id: string }, Invoice>;
```

---

### `useCancelInvoice()`

```ts
export function useCancelInvoice(): UseMutationReturn<{ id: string; reason?: string }, Invoice>;
```

---

### `useCreatePayment()`

```ts
export function useCreatePayment(): UseMutationReturn<CreatePaymentInput, {
  payment: Payment;
  invoice: Invoice;
}>;

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
  attachment?: string;
}
```

**Optimistic update**
- Update `invoice.paidAmount`, `balanceDue`, `status` di detail cache.

**Invalidate:** `invoices.detail(invoiceId)`, `invoices.lists()`, `payments.all`, `analytics.*`.

---

### `useUpdatePayment(id)` / `useDeletePayment()`

Standar pattern. Delete payment akan trigger recalculation invoice → harus invalidate detail.

---

### `useCreateClient()`

```ts
export function useCreateClient(): UseMutationReturn<CreateClientInput, Client>;

export interface CreateClientInput {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  npwp?: string;
  notes?: string;
  tags?: string[];
}
```

**Optimistic update** — Append ke list.

---

### `useUpdateClient(id)` / `useDeleteClient()`

---

### `useUpdateCompany()`

```ts
export function useUpdateCompany(): UseMutationReturn<Partial<Company>, Company>;
```

---

### `useUploadCompanyLogo()`

```ts
export function useUploadCompanyLogo(): UseMutationReturn<File, { logo: string }>;
```

**Behavior**
- Multipart upload ke `/api/company/logo`.
- Optimistic preview pakai `URL.createObjectURL`.

---

### `useMarkNotificationsRead()`

```ts
export function useMarkNotificationsRead(): UseMutationReturn<
  { ids?: string[]; all?: boolean },
  { updated: number }
>;
```

**Optimistic** — Set `readAt` ke now di cache.

---

### `useRegister()`

```ts
export function useRegister(): UseMutationReturn<RegisterInput, { user: User }>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
}
```

**On success** — auto-login + redirect ke `/dashboard`.

---

### `useLogin()`

```ts
export function useLogin(): UseMutationReturn<{ email: string; password: string }, { user: User; expiresAt: string }>;
```

**On success** — invalidate `user.me`, `company.me`, redirect.

---

### `useLogout()`

```ts
export function useLogout(): UseMutationReturn<void, void>;
```

**On success** — `queryClient.clear()`, redirect `/login`.

---

### `useForgotPassword()` / `useResetPassword()`

Self-explanatory.

---

## Utility Hooks

### `useDebounce<T>(value, delay)`

```ts
export function useDebounce<T>(value: T, delay: number = 300): T;
```

**Usage**
```tsx
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);
const { data } = useClients({ q: debouncedSearch });
```

---

### `useMediaQuery(query)`

```ts
export function useMediaQuery(query: string): boolean;
```

**Usage**
```tsx
const isMobile = useMediaQuery("(max-width: 767px)");
```

---

### `useLocalStorage<T>(key, defaultValue)`

```ts
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void];
```

**Behavior**
- SSR-safe (hydration mismatch dihindari).
- Cross-tab sync via `storage` event.

---

### `useToggle(initial?)`

```ts
export function useToggle(initial: boolean = false): [boolean, () => void, (value: boolean) => void];
```

---

### `useCopyToClipboard()`

```ts
export function useCopyToClipboard(): { copy: (text: string) => Promise<boolean>; copied: boolean };
```

**Behavior** — `copied` true selama 2 detik setelah berhasil.

---

### `useKeyboardShortcut(combo, callback, options?)`

```ts
export function useKeyboardShortcut(
  combo: string,           // mis. "cmd+k", "ctrl+shift+s"
  callback: (e: KeyboardEvent) => void,
  options?: { enabled?: boolean; preventDefault?: boolean; target?: HTMLElement | null }
): void;
```

**Auto-detect** — Cmd di Mac, Ctrl di Windows/Linux.

---

### `useCurrencyFormatter(currency?, locale?)`

```ts
export function useCurrencyFormatter(currency: string = "IDR", locale: string = "id-ID"): {
  format: (value: number) => string;
  formatCompact: (value: number) => string; // 1,5 jt
  parse: (str: string) => number | null;
};
```

**Usage**
```tsx
const { format } = useCurrencyFormatter();
return <span>{format(13875000)}</span>; // "Rp13.875.000"
```

---

### `useDateFormatter(locale?)`

```ts
export function useDateFormatter(locale: string = "id-ID"): {
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatRelative: (date: Date | string) => string; // "3 hari yang lalu"
  formatRange: (from: Date, to: Date) => string;
};
```

---

### `useInvoiceTotals(items, options)`
Helper untuk live computation totals di form.

```ts
export interface UseInvoiceTotalsInput {
  items: Array<{ quantity: number; unitPrice: number; discount: number; taxable: boolean }>;
  options: {
    discountType?: DiscountType;
    discountValue?: number;
    taxRate?: number;
    shippingAmount?: number;
  };
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
}

export function useInvoiceTotals(input: UseInvoiceTotalsInput): InvoiceTotals;
```

**Implementation** — Memoized via `useMemo`. Pakai `Decimal.js`.

---

### `useConfirm()`
Programmatic confirm dialog.

```ts
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean>;

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}
```

**Usage**
```tsx
const confirm = useConfirm();
async function handleDelete() {
  if (!await confirm({ title: "Hapus invoice?", variant: "destructive" })) return;
  await deleteInvoice.mutateAsync({ id });
}
```

---

### `usePagination(initial?)`

```ts
export function usePagination(initial?: { page?: number; perPage?: number }): {
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (size: number) => void;
  reset: () => void;
};
```

**Behavior** — sync ke query params (`?page=2&perPage=20`).

---

### `useFilters<T>(initial?)`

```ts
export function useFilters<T extends Record<string, any>>(initial?: T): {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof T) => void;
};
```

**Behavior** — Sync ke URL (debounced 200ms untuk avoid history spam).

---

### `usePrefetch()`
Helper untuk prefetch detail saat hover row.

```ts
export function usePrefetch(): {
  prefetchInvoice: (id: string) => void;
  prefetchClient: (id: string) => void;
};
```

**Usage**
```tsx
const { prefetchInvoice } = usePrefetch();
<TableRow onMouseEnter={() => prefetchInvoice(row.id)} />
```

---

### `useDocumentTitle(title)`

```ts
export function useDocumentTitle(title: string): void;
```

**Behavior** — set `document.title = "${title} — InvoiceForge"`.

---

### `useScrollLock(locked)`
Lock body scroll (untuk drawer/dialog).

```ts
export function useScrollLock(locked: boolean): void;
```

---

### `useOnlineStatus()`

```ts
export function useOnlineStatus(): boolean;
```

**Behavior** — toggle toast "Anda offline" saat status berubah.

---

## Subscription / Realtime Hooks

### `useInvoiceUpdates(invoiceId)` (future)
Untuk realtime update via SSE/WebSocket. MVP: polling 60s.

```ts
export function useInvoiceUpdates(invoiceId: string): { lastUpdate: Date | null };
```

**Implementation note** — sementara pakai `refetchInterval` di `useInvoice(id)`. Migration ke SSE saat ada server WS.

---

## Server-side data fetching

Untuk Next.js App Router (server components), gunakan helper sebagai fallback:

```ts
// src/lib/server/fetch.ts
export async function fetchInvoice(id: string): Promise<InvoiceWithRelations> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return invoiceService.getInvoice(session.user.id, id);
}
```

**Strategi**
- Page-level data → fetch di server component (SSR).
- Hydrate ke TanStack Query menggunakan `dehydrate`/`HydrationBoundary`:

```tsx
// app/invoices/[id]/page.tsx
export default async function Page({ params }) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.invoices.detail(params.id),
    queryFn: () => fetchInvoice(params.id),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvoiceDetailClient id={params.id} />
    </HydrationBoundary>
  );
}
```

Hooks tetap berfungsi normal di client; cache sudah ter-prefill.

---

## Error handling pattern

Semua hook menggunakan `ApiError` class custom:

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ path: string; message: string }>,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

Di component, error mapping:

```tsx
const { error } = useInvoice(id);
if (error instanceof ApiError) {
  if (error.status === 404) return <NotFound />;
  if (error.status === 403) return <Forbidden />;
}
return <ErrorBanner message={error?.message} />;
```

---

## Testing hooks

Pakai `@testing-library/react` `renderHook`:

```ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

it("useInvoices returns data", async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useInvoices(), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
});
```

Mock API via **MSW** (lihat `docs/TESTING.md`).
