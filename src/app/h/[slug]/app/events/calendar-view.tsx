"use client";

import { useMemo, useState, useTransition } from "react";
import { addDays, parseDate, fmtDate } from "@/lib/date-strings";
import { getCalendarData } from "./actions";
import type { CalendarData, CalendarViewMode } from "./calendar-data";
import { MonthGrid } from "./month-grid";
import { WeekGrid } from "./week-grid";
import { CompactCalendar } from "./compact-calendar";
import { EventList } from "./event-list";
import { EVENT_CATEGORIES, filterByCategory, type EventCategoryFilter } from "@/lib/event-categories";

const VIEW_OPTIONS: { key: CalendarViewMode; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "list", label: "List" },
];

const FILTER_OPTIONS: EventCategoryFilter[] = ["All", ...EVENT_CATEGORIES];

function shiftMonth(anchorDate: string, delta: number): string {
  const { y, m } = parseDate(anchorDate);
  let ny = y,
    nm = m + delta;
  if (nm < 1) {
    nm = 12;
    ny--;
  } else if (nm > 12) {
    nm = 1;
    ny++;
  }
  return fmtDate(ny, nm, 1);
}

function monthTitle(anchorDate: string): string {
  const { y, m } = parseDate(anchorDate);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(dt);
}

function weekTitle(gridDates: string[]): string {
  const label = (s: string) => {
    const { y, m, d } = parseDate(s);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(dt);
  };
  return `${label(gridDates[0])} – ${label(gridDates[gridDates.length - 1])}`;
}

export function CalendarView({ slug, initialData }: { slug: string; initialData: CalendarData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  // Direction of the last navigation: 1 = next, -1 = prev, 0 = today/view switch.
  const [dir, setDir] = useState(0);
  // Client-only, like the Activity filters: survives view switches and paging
  // (this component never remounts), resets when you leave the page.
  const [category, setCategory] = useState<EventCategoryFilter>("All");

  // Filter once here so the grids/compact calendar/list stay unaware of it —
  // they just get fewer items (keeps "+N more" counts and dots correct).
  const shown = useMemo(
    () => ({
      ...data,
      occurrencesByDate: filterByCategory(data.occurrencesByDate, category),
      eventList: category === "All" ? data.eventList : data.eventList.filter((e) => e.category === category),
    }),
    [data, category]
  );

  function reload(view: CalendarViewMode, anchorDate: string, direction = 0) {
    startTransition(async () => {
      const next = await getCalendarData(slug, view, anchorDate);
      setDir(direction);
      setData(next);
    });
  }

  function goPrev() {
    const anchor = data.view === "week" ? addDays(data.anchorDate, -7) : shiftMonth(data.anchorDate, -1);
    reload(data.view, anchor, -1);
  }
  function goNext() {
    const anchor = data.view === "week" ? addDays(data.anchorDate, 7) : shiftMonth(data.anchorDate, 1);
    reload(data.view, anchor, 1);
  }
  function goToday() {
    const { todayDate: t, gridDates: g } = data;
    reload(data.view, t, t < g[0] ? -1 : t > g[g.length - 1] ? 1 : 0);
  }

  const isList = data.view === "list";
  const title = isList
    ? "All events"
    : data.view === "month"
    ? monthTitle(data.anchorDate)
    : weekTitle(data.gridDates);

  return (
    <div className={isPending ? "opacity-60 transition-opacity" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Paging doesn't apply to the List view, which shows every event. */}
          {!isList && (
            <>
              <button type="button" onClick={goPrev} className="btn-ghost h-11 min-w-11 px-3 text-sm" aria-label="Previous">
                ←
              </button>
              <button type="button" onClick={goToday} className="btn-ghost h-11 px-3 text-sm">
                Today
              </button>
              <button type="button" onClick={goNext} className="btn-ghost h-11 min-w-11 px-3 text-sm" aria-label="Next">
                →
              </button>
            </>
          )}
          <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
        </div>
        <div className="flex gap-1.5">
          {VIEW_OPTIONS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => reload(v.key, data.anchorDate)}
              className={`h-11 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
                data.view === v.key
                  ? "border-accent bg-accentsoft text-accentdark"
                  : "border-line bg-surface hover:border-accent"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
        {FILTER_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
              category === c
                ? "border-accent bg-accentsoft text-accentdark"
                : "border-line bg-surface hover:border-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Keyed so each new period remounts and replays its entry animation. */}
      <div
        key={`${data.view}-${data.anchorDate}`}
        className={`mt-4 motion-reduce:animate-fade-in ${
          dir > 0 ? "motion-safe:animate-slide-from-right" : dir < 0 ? "motion-safe:animate-slide-from-left" : "motion-safe:animate-fade-in"
        }`}
      >
        {isList ? (
          <EventList slug={slug} items={shown.eventList} />
        ) : (
          <>
            <div className="sm:hidden">
              <CompactCalendar slug={slug} data={shown} />
            </div>
            <div className="hidden sm:block">
              {data.view === "month" ? <MonthGrid slug={slug} data={shown} /> : <WeekGrid slug={slug} data={shown} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
