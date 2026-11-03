import { describe, expect, it } from "vitest";
import { countdownParts, ENTRY_FEE_RUPEES, MATCH_AT } from "@/lib/tournament";

describe("Tournament details", () => {
  it("charges 40 rupees per squad", () => {
    expect(ENTRY_FEE_RUPEES).toBe(40);
  });
  it("sets the match 2 days 20 hours 30 minutes after the requested reset", () => {
    expect(countdownParts(MATCH_AT, Date.parse("2026-11-03T17:42:30Z"))).toEqual([2, 20, 30, 0]);
  });
});