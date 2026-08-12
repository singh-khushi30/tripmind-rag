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

const API = "https://en.wikipedia.org/w/api.php";

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

export async function searchWikipediaPages(
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

export async function fetchWikipediaPage(
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

  return {
    title: page.title,
    pageId: page.pageid ?? null,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    extract,
    sections: splitExtractIntoSections(extract),
    isDisambiguation,
  };
}

export async function fetchWikipediaForDestination(destination: string) {
  const results = await searchWikipediaPages(destination);
  const pages: MediaWikiPage[] = [];

  // Prefer the closest title match first, then at most one related page.
  const normalized = destination.trim().toLowerCase();
  const ordered = [...results].sort((a, b) => {
    const aExact = a.title.toLowerCase() === normalized ? 0 : 1;
    const bExact = b.title.toLowerCase() === normalized ? 0 : 1;
    return aExact - bExact;
  });

  for (const result of ordered.slice(0, 1)) {
    const page = await fetchWikipediaPage(result.title);
    if (page) pages.push(page);
  }

  return pages;
}
