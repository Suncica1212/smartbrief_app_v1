import { describe, expect, it } from "vitest";
import { hashToken, tokenMatches } from "../src/services/crypto.js";

describe("submission access tokens", () => {
  it("matches only the original token", () => {
    const hash = hashToken("correct-token");
    expect(tokenMatches("correct-token", hash)).toBe(true);
    expect(tokenMatches("wrong-token", hash)).toBe(false);
  });
});
