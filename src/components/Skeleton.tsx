// Loading placeholders shared by route-level loading.tsx files and in-page
// <Suspense> fallbacks. Each shape mirrors the real markup's spacing so the
// swap from skeleton → content doesn't shift the layout. Pulse animation is
// already disabled under prefers-reduced-motion by globals.css.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-line/70 ${className}`.trim()} />;
}

// Wrapper for a whole loading page: announces the busy state to screen readers.
export function SkeletonPage({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <main className={className} aria-busy="true">
      <span className="sr-only">Loading…</span>
      {children}
    </main>
  );
}

// PageHeader-shaped placeholder. `title` is static per route, so render it
// for real — immediate confirmation that the tap landed on the right page.
export function PageHeaderSkeleton({
  title,
  withAction = false,
  withBack = true,
}: {
  title: string;
  withAction?: boolean;
  withBack?: boolean;
}) {
  return (
    <div>
      {withBack && <Skeleton className="mb-2 h-4 w-36" />}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {withAction && <Skeleton className="h-9 w-32 rounded-lg" />}
      </div>
    </div>
  );
}

// Stack of white card rows — matches ActivityFeed / shopping / recurring rows.
export function CardListSkeleton({ rows = 4, className = "mt-2" }: { rows?: number; className?: string }) {
  return (
    <ul className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center justify-between rounded-xl bg-surface p-3.5 shadow-card">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-16" />
        </li>
      ))}
    </ul>
  );
}

export function SectionTitleSkeleton({ title }: { title: string }) {
  return (
    <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-inkmuted">{title}</h2>
  );
}

// ---- Dashboard ----

export function BalancesSkeleton() {
  return (
    <section className="mt-6 rounded-xl bg-surface shadow-card" aria-hidden="true">
      <div className="px-5 pb-4 pt-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-1.5 h-9 w-40" />
      </div>
      <div className="flex items-baseline justify-between border-t border-line px-5 pt-4">
        <SectionTitleSkeleton title="Balances" />
        <Skeleton className="h-3 w-32" />
      </div>
      <ul className="mt-2 divide-y divide-line px-5">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </span>
            <Skeleton className="h-5 w-20" />
          </li>
        ))}
      </ul>
      <div className="receipt-edge h-3 w-full bg-surface" />
    </section>
  );
}

export function DashboardActivitySkeleton() {
  return (
    <section className="mt-6">
      <SectionTitleSkeleton title="Activity" />
      <CardListSkeleton rows={5} />
    </section>
  );
}

// ---- Activity page (filter controls + feed) ----

export function ActivityFeedSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-2">
        {["col-span-2", "", "", "", ""].map((span, i) => (
          <div key={i} className={`flex flex-col gap-1 ${span}`}>
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <CardListSkeleton rows={6} />
    </div>
  );
}

// ---- Shopping ----

export function ShoppingListSkeleton() {
  return (
    <section className="mt-6">
      <SectionTitleSkeleton title="Needed" />
      <ul className="mt-2 space-y-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3.5 shadow-card">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-24 shrink-0" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ShoppingAddFormSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row" aria-hidden="true">
      <Skeleton className="h-10 w-full rounded-lg sm:flex-1" />
      <Skeleton className="h-10 w-full rounded-lg sm:flex-1" />
      <Skeleton className="h-10 w-full rounded-lg sm:w-20" />
    </div>
  );
}

// ---- Calendar ----

export function CalendarSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-11 w-16 rounded-lg" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-11 w-20 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
        </div>
      </div>
      {/* Phone: mirrors CompactCalendar (dot grid + selected-day list). */}
      <div className="mt-4 sm:hidden">
        <div className="rounded-xl bg-surface p-2 shadow-card">
          <div className="grid grid-cols-7 gap-y-1 py-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="flex h-12 items-center justify-center">
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="mt-4 h-4 w-20" />
        <CardListSkeleton rows={2} />
      </div>
      <Skeleton className="mt-4 hidden h-[28rem] w-full rounded-xl sm:block" />
    </div>
  );
}

// ---- Create/edit forms ----

export function FormPageSkeleton({ title, fields = 5 }: { title: string; fields?: number }) {
  return (
    <SkeletonPage className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <Skeleton className="h-4 w-14" />
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{title}</h1>
      <div className="mt-6 space-y-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </SkeletonPage>
  );
}
