/** Treat retrieved web content as untrusted before prompt inclusion. */
export function sanitizeRetrievedContent(content: string, maxChars = 1800): string {
  return content
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/```/g, "'''")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}
