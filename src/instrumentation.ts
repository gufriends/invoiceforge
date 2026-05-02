export async function register() {
  // Node.js 22+ exposes a global `localStorage` that requires --localstorage-file.
  // Without a valid path the object exists but its methods are broken, crashing
  // libraries like next-themes and zustand/persist during SSR.
  if (typeof window === "undefined" && typeof localStorage !== "undefined") {
    // @ts-expect-error — intentionally removing the broken server-side global
    globalThis.localStorage = undefined;
  }
}
