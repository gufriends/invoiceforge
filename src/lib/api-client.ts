const API_BASE = "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Sesi habis, silakan login kembali");
  }

  let json: any;
  try { json = await res.json(); } catch { json = null; }

  if (!res.ok) {
    throw new Error(json?.message ?? "Terjadi kesalahan");
  }
  return json.data as T;
}

export async function apiFetchPaginated<T>(path: string): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? "Terjadi kesalahan");
  return json;
}

export function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}