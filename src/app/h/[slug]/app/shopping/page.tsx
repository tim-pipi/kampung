import { Suspense } from "react";
import { db } from "@/db";
import { shoppingItems } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { requireMember } from "@/lib/guard";
import { PageHeader } from "@/components/PageHeader";
import { ShoppingListSkeleton } from "@/components/Skeleton";
import { ShoppingAddForm } from "./shopping-add-form";
import { ShoppingItems } from "./shopping-items";

export const dynamic = "force-dynamic";

export default async function ShoppingPage({ params }: { params: { slug: string } }) {
  const { house, me, houseMembers } = await requireMember(params.slug);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Shopping list"
        description="Add what the house needs. Tick an item off once it's bought — bought items stay visible below so nobody double-buys."
      />

      {/* The add form is usable immediately; the list streams in below it. */}
      <ShoppingAddForm slug={params.slug} />

      <Suspense fallback={<ShoppingListSkeleton />}>
        <ShoppingLists slug={params.slug} houseId={house.id} meId={me.id} houseMembers={houseMembers} />
      </Suspense>
    </main>
  );
}

async function ShoppingLists({
  slug,
  houseId,
  meId,
  houseMembers,
}: {
  slug: string;
  houseId: number;
  meId: number;
  houseMembers: { id: number; username: string }[];
}) {
  const items = await db().query.shoppingItems.findMany({
    where: and(eq(shoppingItems.houseId, houseId), isNull(shoppingItems.archivedAt)),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return (
    <ShoppingItems
      slug={slug}
      meId={meId}
      items={items}
      names={Object.fromEntries(houseMembers.map((m) => [m.id, m.username]))}
    />
  );
}
