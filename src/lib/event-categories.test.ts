import { describe, expect, it } from "vitest";
import { EVENT_CATEGORIES, filterByCategory, isEventCategory } from "./event-categories";

describe("isEventCategory", () => {
  it("accepts every listed category", () => {
    for (const c of EVENT_CATEGORIES) expect(isEventCategory(c)).toBe(true);
  });

  it("rejects unknown, wrong-case, the filter-only 'All', and non-strings", () => {
    expect(isEventCategory("Party")).toBe(false);
    expect(isEventCategory("chores")).toBe(false);
    expect(isEventCategory("All")).toBe(false);
    expect(isEventCategory("")).toBe(false);
    expect(isEventCategory(null)).toBe(false);
    expect(isEventCategory(3)).toBe(false);
  });
});

describe("filterByCategory", () => {
  const byDate = {
    "2026-11-01": [
      { id: 1, category: "Bills" },
      { id: 2, category: "Chores" },
    ],
    "2026-11-02": [{ id: 3, category: "Chores" }],
    "2026-11-03": [] as { id: number; category: string }[],
  };

  it("returns the same object for All", () => {
    expect(filterByCategory(byDate, "All")).toBe(byDate);
  });

  it("keeps only matching items and keeps every date key", () => {
    const out = filterByCategory(byDate, "Chores");
    expect(Object.keys(out)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(out["2026-11-01"].map((i) => i.id)).toEqual([2]);
    expect(out["2026-11-02"].map((i) => i.id)).toEqual([3]);
    expect(out["2026-11-03"]).toEqual([]);
  });

  it("does not mutate the input", () => {
    filterByCategory(byDate, "Bills");
    expect(byDate["2026-11-01"]).toHaveLength(2);
  });
});
