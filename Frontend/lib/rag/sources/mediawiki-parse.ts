export type MediaWikiSearchResult = {
  title: string;
  pageId: number | null;
  snippet: string;
};

export type MediaWikiPage = {
  title: string;
  pageId: number | null;
  url: string;
  extract: string;
  sections: Array<{ title: string; content: string }>;
  isDisambiguation: boolean;
};

export function stripMediaWikiBoilerplate(text: string): string {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/edit\s*$/gim, "")
    .replace(/^\s*coordinates:.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isDisambiguationTitle(title: string, extract: string): boolean {
  const haystack = `${title}\n${extract}`.toLowerCase();
  return (
    title.toLowerCase().includes("(disambiguation)") ||
    haystack.includes("may refer to:") ||
    haystack.includes("can refer to:")
  );
}

function looksLikeSectionHeading(line: string): boolean {
  const trimmed = line.trim().replace(/^==+\s*|\s*==+$/g, "");
  if (!trimmed || trimmed.length > 60) return false;
  if (trimmed.endsWith(".") || trimmed.includes(". ")) return false;
  if (!/^[A-Z0-9]/.test(trimmed)) return false;
  // Prefer short topical headings over sentence fragments.
  const words = trimmed.split(/\s+/);
  return words.length <= 6;
}

export function splitExtractIntoSections(
  extract: string,
): Array<{ title: string; content: string }> {
  const cleaned = stripMediaWikiBoilerplate(extract);
  if (!cleaned) return [];

  const lines = cleaned.split("\n");
  const sections: Array<{ title: string; content: string }> = [];
  let currentTitle = "Overview";
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content.length > 40) {
      sections.push({ title: currentTitle, content });
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      looksLikeSectionHeading(trimmed) &&
      (buffer.length > 0 || sections.length > 0)
    ) {
      flush();
      currentTitle = trimmed.replace(/^==+\s*|\s*==+$/g, "");
      continue;
    }
    buffer.push(line);
  }

  flush();

  if (sections.length === 0 && cleaned.length > 40) {
    return [{ title: "Overview", content: cleaned }];
  }

  return sections;
}
