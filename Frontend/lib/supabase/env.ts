export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      [
        "Missing Supabase environment variables.",
        "Add values in Frontend/.env.local:",
        "  NEXT_PUBLIC_SUPABASE_URL=<your Project URL>",
        "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your Publishable Key>",
        "Then restart the Next.js dev server.",
      ].join(" "),
    );
  }

  return { url, key };
}
