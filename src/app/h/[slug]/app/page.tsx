import { Suspense } from "react";
import Link from "next/link";
import { requireMember } from "@/lib/guard";
import { BalancesSkeleton, DashboardActivitySkeleton } from "@/components/Skeleton";
import { KampungMark } from "@/components/KampungArt";
import { ActivitySection, BalancesSection, UpcomingSection } from "./dashboard-sections";

export const dynamic = "force-dynamic";

// The header renders as soon as the auth guard resolves; each data section
// streams in behind its own <Suspense> boundary (see dashboard-sections.tsx).
export default async function Dashboard({ params }: { params: { slug: string } }) {
  const { house, me, houseMembers } = await requireMember(params.slug);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-36 pt-6 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <KampungMark className="h-3.5 w-3.5" />
            Kampung
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{house.name}</h1>
        </div>
        {/* Avatar leads to More, where Log out lives (rarely used, so off the dashboard). */}
        <Link
          href={`/h/${params.slug}/app/more`}
          className="-m-1.5 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
          aria-label={`Signed in as ${me.username}. Account and more`}
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: me.color }}
          >
            {me.username.slice(0, 1).toUpperCase()}
          </span>
        </Link>
      </header>

      <Suspense fallback={<BalancesSkeleton />}>
        <BalancesSection slug={params.slug} houseId={house.id} meId={me.id} houseMembers={houseMembers} />
      </Suspense>

      {/* No skeleton: the section only renders when events exist, so a
          placeholder would often flash and then vanish. */}
      <Suspense fallback={null}>
        <UpcomingSection slug={params.slug} houseId={house.id} />
      </Suspense>

      <Suspense fallback={<DashboardActivitySkeleton />}>
        <ActivitySection slug={params.slug} houseId={house.id} houseMembers={houseMembers} />
      </Suspense>

      {/* Add expense FAB — 5rem clears the 64px bottom nav bar (h-16) with a margin, plus the home-indicator inset */}
      <Link
        href={`/h/${params.slug}/app/expenses/new`}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 rounded-full bg-accent px-5 py-3 font-display font-semibold text-onaccent shadow-card transition duration-100 hover:bg-accentdark active:scale-95"
      >
        + Add expense
      </Link>
    </main>
  );
}
