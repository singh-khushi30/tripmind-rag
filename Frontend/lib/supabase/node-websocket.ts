import "server-only";

/**
 * Node 20 lacks a global WebSocket; @supabase/supabase-js needs one.
 * Safe no-op when WebSocket already exists (Node 22+ / browsers).
 */
export function ensureNodeWebSocket() {
  if (typeof globalThis.WebSocket !== "undefined") return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require("ws");
    (globalThis as typeof globalThis & { WebSocket: unknown }).WebSocket = ws;
  } catch (error) {
    throw new Error(
      "Supabase requires a WebSocket implementation on this Node version. Install the `ws` package or upgrade to Node 22+.",
      { cause: error },
    );
  }
}
