import { db } from "@/db";
import { houseEvents, members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sgToday } from "@/lib/recurring";
import { getMonthGridDates, getWeekDates } from "@/lib/calendar-grid";
import {
  projectOccurrences,
  formatEventDate,
  formatEventTime,
  describeRecurrence,
  fmtDate,
  type Recurrence,
} from "@/lib/events";
import { isEventCategory, type EventCategory } from "@/lib/event-categories";

export type CalendarViewMode = "month" | "week" | "list";

// Untrusted view strings (URL, client action args) collapse to "month".
export function parseViewMode(v: unknown): CalendarViewMode {
  return v === "week" || v === "list" ? v : "month";
}

export type CalendarOccurrence = {
  id: number;
  title: string;
  note: string | null;
  category: EventCategory;
  active: boolean;
  startTime: string | null;
  endTime: string | null;
  timeLabel: string | null;
  color: string;
};

// One row per event (not per occurrence) for the List view. Display strings are
// built here because describeRecurrence lives in server-only lib/events.ts.
export type CalendarListItem = {
  id: number;
  title: string;
  note: string | null;
  category: EventCategory;
  active: boolean;
  nextDate: string;
  dateLabel: string; // "Sat 8 Aug"
  timeLabel: string | null; // null = all day
  recurrenceLabel: string; // "one-off", "monthly on day 1", ...
  reminderLabel: string; // "1 day before", "on the day"
  addedBy: string;
  color: string;
};

export type CalendarData = {
  view: CalendarViewMode;
  anchorDate: string;
  gridDates: string[];
  todayDate: string;
  occurrencesByDate: Record<string, CalendarOccurrence[]>;
  // Active events soonest-first, then paused/finished ones soonest-first.
  eventList: CalendarListItem[];
};

function reminderLabel(days: number): string {
  if (days === 0) return "on the day";
  return `${days} day${days === 1 ? "" : "s"} before`;
}

// Shared by events/page.tsx (initial server-rendered load) and the
// getCalendarData action (client-side nav) so there's one fetch+project path.
// Fetches all house_events for the house (household scale — well under a few
// hundred rows ever — so no date-range SQL is needed) and projects each
// event's occurrences over the visible grid range in memory. Never writes
// anything; house_events storage and runEventScan()'s reminder/roll-over
// logic are completely untouched by this read path.
export async function buildCalendarData(
  houseId: number,
  view: CalendarViewMode,
  anchorDate: string
): Promise<CalendarData> {
  const { year, month, day } = sgToday();
  const todayDate = fmtDate(year, month, day);

  const [ay, am] = anchorDate.split("-").map(Number);
  // List view still gets the anchor's month grid, so switching back to Month/Week
  // from List never sees an empty grid.
  const gridDates = view === "week" ? getWeekDates(anchorDate) : getMonthGridDates(ay, am);
  const rangeStart = gridDates[0];
  const rangeEnd = gridDates[gridDates.length - 1];

  const [events, houseMembers] = await Promise.all([
    db().query.houseEvents.findMany({ where: eq(houseEvents.houseId, houseId) }),
    db().query.members.findMany({
      where: eq(members.houseId, houseId),
      columns: { id: true, color: true, username: true },
    }),
  ]);
  const colorByMember = new Map(houseMembers.map((m) => [m.id, m.color]));
  const nameByMember = new Map(houseMembers.map((m) => [m.id, m.username]));
  const categoryOf = (c: string): EventCategory => (isEventCategory(c) ? c : "Other");

  const occurrencesByDate: Record<string, CalendarOccurrence[]> = {};
  for (const date of gridDates) occurrencesByDate[date] = [];

  for (const e of events) {
    const recurrence = e.recurrence as Recurrence;
    const raw = projectOccurrences(e, rangeStart, rangeEnd);
    // One-off events always show at their stored date regardless of `active`
    // (calendar history is preserved). Recurring events project freely while
    // active; once paused, only occurrences on or before today keep showing —
    // future projection stops immediately, past history does not disappear.
    // See CLAUDE.md Invariant #12.
    const dates =
      recurrence.freq === "none" || e.active === 1 ? raw : raw.filter((d) => d <= todayDate);
    if (dates.length === 0) continue;

    const item: CalendarOccurrence = {
      id: e.id,
      title: e.title,
      note: e.note,
      category: categoryOf(e.category),
      active: e.active === 1,
      startTime: e.startTime,
      endTime: e.endTime,
      timeLabel: formatEventTime(e.startTime, e.endTime),
      color: colorByMember.get(e.createdBy) ?? "#0E7C6B",
    };
    for (const date of dates) {
      occurrencesByDate[date]?.push(item);
    }
  }

  // Sort on raw fields: "HH:MM" strings order correctly, display labels don't
  // ("10:00 AM" < "9:00 AM"). All-day ("") sorts before timed on the same date.
  const eventList: CalendarListItem[] = [...events]
    .sort(
      (a, b) =>
        b.active - a.active ||
        a.nextDate.localeCompare(b.nextDate) ||
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        a.id - b.id
    )
    .map((e) => ({
      id: e.id,
      title: e.title,
      note: e.note,
      category: categoryOf(e.category),
      active: e.active === 1,
      nextDate: e.nextDate,
      dateLabel: formatEventDate(e.nextDate),
      timeLabel: formatEventTime(e.startTime, e.endTime),
      recurrenceLabel: describeRecurrence(e.recurrence as Recurrence),
      reminderLabel: reminderLabel(e.remindDaysBefore),
      addedBy: nameByMember.get(e.createdBy) ?? "someone",
      color: colorByMember.get(e.createdBy) ?? "#0E7C6B",
    }));

  return { view, anchorDate, gridDates, todayDate, occurrencesByDate, eventList };
}
