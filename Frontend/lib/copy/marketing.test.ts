import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("pre-RAG marketing copy", () => {
  it("does not show source-grounded claims before RAG", () => {
    const files = [
      "components/cards/landing-hero.tsx",
      "components/layout/footer.tsx",
      "app/layout.tsx",
      "data/mock/planner-options.ts",
      "components/trip/results-view.tsx",
    ];

    for (const relative of files) {
      const contents = readFileSync(path.join(root, relative), "utf8");
      expect(contents.toLowerCase()).not.toContain("source-grounded");
      expect(contents.toLowerCase()).not.toContain("sources behind");
    }
  });
});
