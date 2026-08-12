import "server-only";

import {
  WIKIMEDIA_TIMEOUT_MS,
  WIKIMEDIA_USER_AGENT,
} from "@/lib/rag/constants";
import type {
  MediaWikiPage,
  MediaWikiSearchResult,
} from "@/lib/rag/sources/mediawiki-parse";

export type { MediaWikiPage, MediaWikiSearchResult };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mediaWikiFetchJson<T>(
  apiBase: string,
  params: Record<string, string>,
  retries = 2,
): Promise<T> {
  const url = new URL(apiBase);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WIKIMEDIA_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": WIKIMEDIA_USER_AGENT,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`MediaWiki temporary failure: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`MediaWiki request failed: ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("MediaWiki request failed");
}
