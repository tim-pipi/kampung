import Link from "next/link";
import type { CalendarListItem } from "./calendar-data";

// List view: one card per event with every detail, so the house can review and
// edit events without opening them one by one from the grid. Edit links carry
// ?from=list so save/delete/back return here (see saveEvent's eventsHref).
export function EventList({ slug, items }: { slug: string; items: CalendarListItem[] }) {
  const upcoming = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-inkmuted">
        No events here yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Upcoming" slug={slug} items={upcoming} empty="Nothing active." />
      {inactive.length > 0 && (
        <Section title="Paused / done" slug={slug} items={inactive} dimmed />
      )}
    </div>
  );
}

function Section({
  title,
  slug,
  items,
  empty,
  dimmed = false,
}: {
  title: string;
  slug: string;
  items: CalendarListItem[];
  empty?: string;
  dimmed?: boolean;
}) {
  return (
    <section>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-inkmuted">
        {title} <span className="tnum font-normal">· {items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-inkmuted">{empty}</p>
      ) : (
        <ul className={`mt-2 space-y-2 ${dimmed ? "opacity-60" : ""}`}>
          {items.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 rounded-xl border-l-4 bg-surface p-3.5 shadow-card"
              style={{ borderLeftColor: e.color }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{e.title}</span>
                  <span className="rounded-full bg-accentsoft px-2 py-0.5 text-xs font-medium text-accentdark">
                    {e.category}
                  </span>
                </div>
                <p className="tnum mt-1 text-sm">
                  {e.dateLabel} · {e.timeLabel ?? "All day"}
                </p>
                <p className="mt-0.5 text-xs text-inkmuted">
                  {capitalize(e.recurrenceLabel)} · Reminder {e.reminderLabel} · Added by {e.addedBy}
                </p>
                {e.note && <p className="mt-1 text-sm text-inkmuted">{e.note}</p>}
              </div>
              <Link
                href={`/h/${slug}/app/events/${e.id}?from=list`}
                className="btn-ghost -my-1 h-11 shrink-0 px-3 text-sm"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// "monthly on day 1" -> "Monthly on day 1", "one-off" -> "One-off".
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
