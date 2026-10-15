import { describe, expect, it } from "vitest";
import {
  DEFAULT_FEED_QUERY,
  applyFeedQuery,
  buildFeed,
  addedOnOtherDay,
  fmtAdded,
  fmtDay,
  parseFeedQuery,
  type FeedQuery,
} from "./activity";

// Rows only carry the columns the feed logic reads; the cast keeps fixtures short.
function expense(o: {
  id: number;
  date: string;
  createdAt: string;
  amountCents?: number;
  category?: string;
  payer?: number;
}) {
  return {
    id: o.id,
    date: o.date,
    createdAt: new Date(o.createdAt),
    amountCents: o.amountCents ?? 1000,
    category: o.category ?? "Food",
    payerMemberId: o.payer ?? 1,
  } as Parameters<typeof buildFeed>[0][number];
}

function settlement(o: {
  id: number;
  date: string;
  createdAt: string;
  amountCents?: number;
  from?: number;
  to?: number;
}) {
  return {
    id: o.id,
    date: o.date,
    createdAt: new Date(o.createdAt),
    amountCents: o.amountCents ?? 1000,
    fromMemberId: o.from ?? 1,
    toMemberId: o.to ?? 2,
  } as Parameters<typeof buildFeed>[1][number];
}

const q = (over: Partial<FeedQuery> = {}): FeedQuery => ({ ...DEFAULT_FEED_QUERY, ...over });
const keys = (feed: ReturnType<typeof buildFeed>) =>
  feed.map((i) => `${i.kind === "expense" ? "e" : "s"}${i.id}`);

// A backdated expense (date old, added last) is the case "recently added" exists for.
const backdated = expense({ id: 1, date: "2026-01-05", createdAt: "2026-09-19T06:00:00Z", amountCents: 500 });
const recentDate = expense({ id: 2, date: "2026-09-18", createdAt: "2026-09-18T01:00:00Z", amountCents: 9000, category: "Rent", payer: 2 });
const settle = settlement({ id: 1, date: "2026-09-17", createdAt: "2026-09-17T01:00:00Z", amountCents: 2500, from: 3, to: 1 });

describe("DEFAULT_FEED_QUERY", () => {
  it("defaults to recently added with no filters", () => {
    expect(DEFAULT_FEED_QUERY).toEqual({
      sort: "added",
      type: "all",
      memberId: null,
      category: null,
      month: null,
    });
  });
});

describe("buildFeed sorting", () => {
  it("defaults to recently added: created_at desc, not the expense date", () => {
    expect(keys(buildFeed([backdated, recentDate], [settle]))).toEqual(["e1", "e2", "s1"]);
  });

  it("sorts by expense date desc when asked", () => {
    expect(keys(buildFeed([backdated, recentDate], [settle], "date"))).toEqual(["e2", "s1", "e1"]);
  });

  it("sorts by amount high to low, then low to high", () => {
    expect(keys(buildFeed([backdated, recentDate], [settle], "amountDesc"))).toEqual(["e2", "s1", "e1"]);
    expect(keys(buildFeed([backdated, recentDate], [settle], "amountAsc"))).toEqual(["e1", "s1", "e2"]);
  });

  it("breaks created_at ties by id desc", () => {
    const a = expense({ id: 10, date: "2026-09-01", createdAt: "2026-09-01T00:00:00Z" });
    const b = expense({ id: 11, date: "2026-09-01", createdAt: "2026-09-01T00:00:00Z" });
    expect(keys(buildFeed([a, b], []))).toEqual(["e11", "e10"]);
  });

  it("breaks amount ties by recently added", () => {
    const a = expense({ id: 1, date: "2026-09-01", createdAt: "2026-09-01T00:00:00Z", amountCents: 700 });
    const b = expense({ id: 2, date: "2026-09-01", createdAt: "2026-09-02T00:00:00Z", amountCents: 700 });
    expect(keys(buildFeed([a, b], [], "amountDesc"))).toEqual(["e2", "e1"]);
  });
});

describe("applyFeedQuery filters", () => {
  const all = buildFeed([backdated, recentDate], [settle]);

  it("returns everything for the default query", () => {
    expect(keys(applyFeedQuery(all, q()))).toEqual(["e1", "e2", "s1"]);
  });

  it("filters by type", () => {
    expect(keys(applyFeedQuery(all, q({ type: "expense" })))).toEqual(["e1", "e2"]);
    expect(keys(applyFeedQuery(all, q({ type: "settlement" })))).toEqual(["s1"]);
  });

  it("filters person as payer for expenses and from/to for settlements", () => {
    expect(keys(applyFeedQuery(all, q({ memberId: 1 })))).toEqual(["e1", "s1"]); // payer of e1, receiver in s1
    expect(keys(applyFeedQuery(all, q({ memberId: 3 })))).toEqual(["s1"]); // settlement sender only
    expect(keys(applyFeedQuery(all, q({ memberId: 2 })))).toEqual(["e2"]);
  });

  it("category filter hides settlements", () => {
    expect(keys(applyFeedQuery(all, q({ category: "Rent" })))).toEqual(["e2"]);
  });

  it("filters month by the item's date, for expenses and settlements", () => {
    expect(keys(applyFeedQuery(all, q({ month: "2026-01" })))).toEqual(["e1"]);
    expect(keys(applyFeedQuery(all, q({ month: "2026-09" })))).toEqual(["e2", "s1"]);
  });

  it("combines filters with AND and applies the chosen sort", () => {
    expect(keys(applyFeedQuery(all, q({ month: "2026-09", sort: "amountAsc" })))).toEqual(["s1", "e2"]);
    expect(keys(applyFeedQuery(all, q({ type: "expense", memberId: 3 })))).toEqual([]);
  });
});

describe("parseFeedQuery", () => {
  it("returns the default for missing or non-object input", () => {
    expect(parseFeedQuery(undefined)).toEqual(DEFAULT_FEED_QUERY);
    expect(parseFeedQuery(null)).toEqual(DEFAULT_FEED_QUERY);
    expect(parseFeedQuery("nope")).toEqual(DEFAULT_FEED_QUERY);
  });

  it("falls back to defaults for unknown sort/type values", () => {
    const parsed = parseFeedQuery({ sort: "random", type: "everything" });
    expect(parsed.sort).toBe("added");
    expect(parsed.type).toBe("all");
  });

  it("accepts valid values", () => {
    expect(
      parseFeedQuery({ sort: "amountDesc", type: "expense", memberId: 4, category: "Rent", month: "2026-09" })
    ).toEqual({ sort: "amountDesc", type: "expense", memberId: 4, category: "Rent", month: "2026-09" });
  });

  it("rejects malformed memberId, category and month", () => {
    const parsed = parseFeedQuery({ memberId: "1; DROP", category: 5, month: "September" });
    expect(parsed.memberId).toBeNull();
    expect(parsed.category).toBeNull();
    expect(parsed.month).toBeNull();
    expect(parseFeedQuery({ memberId: 1.5 }).memberId).toBeNull();
    expect(parseFeedQuery({ memberId: -2 }).memberId).toBeNull();
    expect(parseFeedQuery({ month: "2026-13" }).month).toBeNull();
  });
});

describe("fmtAdded", () => {
  it("renders in Singapore time, not UTC", () => {
    expect(fmtAdded(new Date("2026-09-19T06:32:00Z"))).toBe("19 Sep, 14:32");
  });

  it("rolls the date over when SGT crosses midnight", () => {
    expect(fmtAdded(new Date("2026-09-19T16:05:00Z"))).toBe("20 Sep, 00:05");
  });

  it("zero-pads hours and minutes", () => {
    expect(fmtAdded(new Date("2026-01-02T01:03:00Z"))).toBe("2 Jan, 09:03");
  });
});

describe("fmtDay", () => {
  const now = new Date("2026-10-15T04:00:00Z");
  it("drops the year for the current SGT year", () => {
    expect(fmtDay("2026-10-04", now)).toBe("4 Oct");
  });
  it("keeps the year for other years", () => {
    expect(fmtDay("2025-12-31", now)).toBe("31 Dec 2025");
  });
  it("uses the SGT year at the UTC/SGT new-year boundary", () => {
    // 31 Dec 17:00 UTC is already 1 Jan 2027 in Singapore.
    expect(fmtDay("2027-01-01", new Date("2026-12-31T17:00:00Z"))).toBe("1 Jan");
  });
});

describe("addedOnOtherDay", () => {
  it("is false when entered on the item's own SGT day", () => {
    expect(addedOnOtherDay(new Date("2026-10-15T04:00:00Z"), "2026-10-15")).toBe(false);
  });
  it("is true for a backdated item", () => {
    expect(addedOnOtherDay(new Date("2026-10-15T04:00:00Z"), "2026-10-12")).toBe(true);
  });
  it("compares in SGT, not UTC", () => {
    // 16:30 UTC on the 14th is 00:30 on the 15th in Singapore.
    expect(addedOnOtherDay(new Date("2026-10-14T16:30:00Z"), "2026-10-15")).toBe(false);
    expect(addedOnOtherDay(new Date("2026-10-14T16:30:00Z"), "2026-10-14")).toBe(true);
  });
});
