import { describe, expect, it } from "vitest";

import { isNextRedirectError } from "@/lib/next/errors";

describe("isNextRedirectError", () => {
  it("detects Next.js redirect digests", () => {
    expect(
      isNextRedirectError(
        Object.assign(new Error("NEXT_REDIRECT"), {
          digest: "NEXT_REDIRECT;push;/trip/123;303;",
        }),
      ),
    ).toBe(true);
  });

  it("ignores normal errors", () => {
    expect(isNextRedirectError(new Error("boom"))).toBe(false);
    expect(isNextRedirectError(null)).toBe(false);
  });
});
