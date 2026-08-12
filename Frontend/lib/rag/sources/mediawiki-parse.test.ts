import { describe, expect, it } from "vitest";

import {
  isDisambiguationTitle,
  splitExtractIntoSections,
  stripMediaWikiBoilerplate,
} from "@/lib/rag/sources/mediawiki-parse";

describe("MediaWiki parsing", () => {
  it("removes Wikipedia boilerplate markers", () => {
    const cleaned = stripMediaWikiBoilerplate(
      "Paris is a city.[1]\nCoordinates: 48°N\nSee also edit\n",
    );
    expect(cleaned).not.toMatch(/\[\d+\]/);
    expect(cleaned.toLowerCase()).not.toContain("coordinates:");
  });

  it("detects disambiguation pages", () => {
    expect(
      isDisambiguationTitle("Paris (disambiguation)", "Paris may refer to:"),
    ).toBe(true);
    expect(isDisambiguationTitle("Paris", "Paris is the capital of France.")).toBe(
      false,
    );
  });

  it("splits extracts into section blocks", () => {
    const sections = splitExtractIntoSections(
      [
        "Paris is the capital of France with historic neighborhoods.",
        "See",
        "Visit the Louvre and walk along the Seine for classic museum days.",
        "Eat",
        "Neighborhood bistros serve seasonal menus across the city.",
      ].join("\n"),
    );

    expect(sections.length).toBeGreaterThan(1);
    expect(sections.some((section) => section.title === "See")).toBe(true);
  });

  it("parses Wikivoyage-style travel sections", () => {
    const sections = splitExtractIntoSections(
      [
        "Paris is a major European travel destination for culture and food.",
        "Understand",
        "The city is organized into arrondissements with distinct character.",
        "Get around",
        "The Metro is the fastest way for most visitors to move between districts.",
        "Stay safe",
        "Watch for pickpockets in crowded tourist areas and on public transit.",
      ].join("\n"),
    );

    const titles = sections.map((section) => section.title.toLowerCase());
    expect(titles).toEqual(
      expect.arrayContaining(["understand", "get around", "stay safe"]),
    );
  });
});
