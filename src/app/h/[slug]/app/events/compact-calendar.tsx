"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtDay } from "@/lib/activity";
import type { CalendarData } from "./calendar-data";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Phone layout (iPhone Calendar style): a compact 7-column grid with event dots,
// and the selected day's events listed underneath. Works for both views — month
// passes 5–6 rows of dates, week passes one. The wide grids stay for sm+.
export function CompactCalendar({ slug, data }: { slug: string; data: CalendarData }) {
  const anchorMonth = Number(data.anchorDate.split("-")[1]);
  const inMonth = (date: string) => data.view === "week" || Number(date.split("-")[1]) === anchorMonth;
  const [selected, setSelected] = useState(
    data.gridDates.includes(data.todayDate) && inMonth(data.todayDate)
      ? data.todayDate
      : data.gridDates.find(inMonth) ?? data.gridDates[0]
  );
  const events = data.occurrencesByDate[selected] ?? [];

  return (
    <div>
      <div className="rounded-xl bg-surface p-2 shadow-card">
        <div className="grid grid-cols-7 text-center text-xs font-medium text-inkmuted">
          {WEEKDAY_LABELS.map((l, i) => (
            <div key={i} className="py-1">
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {data.gridDates.map((date) => {
            const day = Number(date.split("-")[2]);
            const isToday = date === data.todayDate;
            const isSelected = date === selected;
            const dots = (data.occurrencesByDate[date] ?? []).slice(0, 3);
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                aria-pressed={isSelected}
                aria-label={`${fmtDay(date)}, ${data.occurrencesByDate[date]?.length ?? 0} events`}
                className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg transition active:scale-95"
              >
                <span
                  className={`tnum flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isSelected
                      ? isToday
                        ? "bg-accent font-semibold text-onaccent"
                        : "bg-ink font-semibold text-paper"
                      : isToday
                      ? "font-semibold text-accent"
                      : inMonth(date)
                      ? "text-ink"
                      : "text-inkmuted/50"
                  }`}
                >
                  {day}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {dots.map((o, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: o.color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-inkmuted">
          {fmtDay(selected)}
        </h2>
        <Link
          href={`/h/${slug}/app/events/new?date=${selected}`}
          className="-my-2 flex h-11 items-center text-sm font-medium text-accent"
        >
          + Add event
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-line p-5 text-center text-sm text-inkmuted">
          Nothing on this day.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {events.map((occ) => (
            <li key={occ.id}>
              <Link
                href={`/h/${slug}/app/events/${occ.id}`}
                className={`flex gap-3 rounded-xl border-l-4 bg-surface p-3.5 shadow-card transition active:bg-accentsoft/60 ${
                  !occ.active ? "opacity-60" : ""
                }`}
                style={{ borderLeftColor: occ.color }}
              >
                <span className="tnum w-20 shrink-0 text-sm text-inkmuted">{occ.timeLabel ?? "All day"}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{occ.title}</span>
                  {occ.note && <span className="block text-xs text-inkmuted">{occ.note}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
