import "server-only";

import {
  mediaWikiFetchJson,
  type MediaWikiPage,
  type MediaWikiSearchResult,
} from "@/lib/rag/sources/mediawiki";
import {
  isDisambiguationTitle,
  splitExtractIntoSections,
  stripMediaWikiBoilerplate,
} from "@/lib/rag/sources/mediawiki-parse";

const API = "https://en.wikivoyage.org/w/api.php";

const PRIORITY_SECTIONS = [
  "understand",
  "see",
  "do",
  "eat",
  "get around",
  "stay safe",
  "get in",
  "buy",
  "sleep",
];

type SearchResponse = {
  query?: {
    search?: Array<{
      title: string;
      pageid?: number;
      snippet?: string;
    }>;
  };
};

type ExtractResponse = {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        extract?: string;
        missing?: boolean;
      }
    >;
  };
};

export async function searchWikivoyagePages(
  destination: string,
): Promise<MediaWikiSearchResult[]> {
  const data = await mediaWikiFetchJson<SearchResponse>(API, {
    action: "query",
    list: "search",
    srsearch: destination,
    srlimit: "5",
    srprop: "snippet",
  });

  return (data.query?.search ?? []).map((item) => ({
    title: item.title,
    pageId: item.pageid ?? null,
    snippet: stripMediaWikiBoilerplate(item.snippet ?? ""),
  }));
}

export async function fetchWikivoyagePage(
  pageTitle: string,
): Promise<MediaWikiPage | null> {
  const data = await mediaWikiFetchJson<ExtractResponse>(API, {
    action: "query",
    prop: "extracts",
    explaintext: "1",
    exsectionformat: "plain",
    redirects: "1",
    titles: pageTitle,
  });

  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing || !page.title || !page.extract) {
    return null;
  }

  const extract = stripMediaWikiBoilerplate(page.extract);
  if (!extract || extract.length < 120) return null;

  const isDisambiguation = isDisambiguationTitle(page.title, extract);
  if (isDisambiguation) return null;

  const sections = splitExtractIntoSections(extract).filter((section) => {
    const title = section.title.toLowerCase();
    return (
      title === "overview" ||
      PRIORITY_SECTIONS.some((priority) => title.includes(priority))
    );
  });

  return {
    title: page.title,
    pageId: page.pageid ?? null,
    url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    extract,
    sections: sections.length > 0 ? sections : splitExtractIntoSections(extract),
    isDisambiguation,
  };
}

export async function fetchWikivoyageForDestination(destination: string) {
  const results = await searchWikivoyagePages(destination);
  const pages: MediaWikiPage[] = [];

  for (const result of results.slice(0, 2)) {
    const page = await fetchWikivoyagePage(result.title);
    if (page) pages.push(page);
  }

  return pages;
}
