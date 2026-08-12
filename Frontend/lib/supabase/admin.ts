import "server-only";

import { createClient } from "@supabase/supabase-js";

import { ensureNodeWebSocket } from "@/lib/supabase/node-websocket";
import type { Database } from "@/types/database";

/**
 * Server-only privileged Supabase client for RAG ingestion writes.
 *
 * Use only for:
 * - upserting travel_sources
 * - upserting travel_document_chunks
 * - checking/refreshing indexed travel content
 *
 * Never import into client components, browser clients, or frontend requests.
 * Never expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_ or logs.
 */
function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL for server-side RAG ingestion.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      [
        "Missing SUPABASE_SERVICE_ROLE_KEY.",
        "Add it to Frontend/.env.local (server-only, never NEXT_PUBLIC_).",
        "Then restart the Next.js server.",
      ].join(" "),
    );
  }

  return { url, serviceRoleKey };
}

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  ensureNodeWebSocket();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
