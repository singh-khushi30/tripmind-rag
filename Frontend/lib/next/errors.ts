/**
 * Server Actions that call redirect() throw a special error Next uses for navigation.
 * Client catch blocks must ignore these so a successful redirect is not shown as a failure.
 */
export function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("digest" in error)) return false;

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
