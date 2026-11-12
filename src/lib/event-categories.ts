// Calendar event categories. Client-safe (no db/telegram imports) — imported by
// the event form, the calendar filter, and saveEvent's validation alike.
// Categories only drive calendar filtering; reminders/digest never read them.

export const EVENT_CATEGORIES = ["Chores", "Bills", "Maintenance", "Social", "Other"] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// "All" is the filter's no-op value, never a stored category.
export type EventCategoryFilter = EventCategory | "All";

export function isEventCategory(v: unknown): v is EventCategory {
  return typeof v === "string" && (EVENT_CATEGORIES as readonly string[]).includes(v);
}

// Filters a date -> items map by category, keeping every date key (empty days
// must stay in the map so grids still render them). Returns the input untouched
// for "All".
export function filterByCategory<T extends { category: string }>(
  byDate: Record<string, T[]>,
  filter: EventCategoryFilter
): Record<string, T[]> {
  if (filter === "All") return byDate;
  const out: Record<string, T[]> = {};
  for (const [date, items] of Object.entries(byDate)) {
    out[date] = items.filter((i) => i.category === filter);
  }
  return out;
}
