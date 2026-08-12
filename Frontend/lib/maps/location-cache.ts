import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { LocationCacheRow, LocationCacheInsert } from "@/types/database";

export async function getCachedGeocode(
  normalizedQuery: string,
): Promise<LocationCacheRow | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("location_cache")
      .select("*")
      .eq("normalized_query", normalizedQuery)
      .maybeSingle();

    if (error || !data) return null;
    return data as LocationCacheRow;
  } catch {
    return null;
  }
}

export async function setCachedGeocode(
  row: LocationCacheInsert,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("location_cache").upsert(
      {
        ...row,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "normalized_query" },
    );
  } catch {
    // Cache write failures must not break trip generation.
  }
}
