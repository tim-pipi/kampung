"use client";

import { useOptimistic } from "react";
import { Card } from "@/components/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { buyItem, untickItem, clearBought } from "./actions";

type Item = {
  id: number;
  name: string;
  note: string | null;
  addedBy: number;
  boughtBy: number | null;
  boughtAt: Date | null;
};

// Ticks flip instantly (useOptimistic) and the item moves between lists before
// the server answers; React drops the optimistic state once the revalidated
// list arrives, or rolls it back if the action throws.
export function ShoppingItems({
  slug,
  meId,
  items,
  names,
}: {
  slug: string;
  meId: number;
  items: Item[];
  names: Record<number, string>;
}) {
  const [shown, setBought] = useOptimistic(items, (state, { id, bought }: { id: number; bought: boolean }) =>
    state.map((i) =>
      i.id === id ? { ...i, boughtAt: bought ? new Date() : null, boughtBy: bought ? meId : null } : i
    )
  );

  const open = shown.filter((i) => !i.boughtAt);
  const bought = shown
    .filter((i) => i.boughtAt)
    .sort((a, b) => ((a.boughtAt as Date) < (b.boughtAt as Date) ? 1 : -1));

  // Visible circle stays 20px; the button around it is a 44px tap target.
  const tickClass = "-m-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:scale-90 transition";

  return (
    <>
      <section className="mt-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-inkmuted">
          Needed{open.length > 0 ? ` (${open.length})` : ""}
        </h2>
        {open.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-line p-6 text-center text-sm text-inkmuted">
            Nothing on the list.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {open.map((item) => (
              <Card as="li" key={item.id} className="flex items-center gap-3">
                <form
                  action={async (fd) => {
                    setBought({ id: item.id, bought: true });
                    await buyItem(fd);
                  }}
                >
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    className={`group ${tickClass}`}
                    aria-label={`Mark ${item.name} as bought`}
                    title="Mark as bought"
                  >
                    <span className="h-5 w-5 rounded-full border-2 border-line transition-colors group-hover:border-accent" />
                  </button>
                </form>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.name}</span>
                  {item.note && <span className="block text-xs text-inkmuted">{item.note}</span>}
                </span>
                <span className="shrink-0 text-xs text-inkmuted">added by {names[item.addedBy] ?? "?"}</span>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {bought.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-inkmuted">
              Bought ({bought.length})
            </h2>
            <form action={clearBought}>
              <input type="hidden" name="slug" value={slug} />
              <SubmitButton className="btn-ghost px-3 py-1 text-xs" pendingLabel="Clearing…">
                Clear bought
              </SubmitButton>
            </form>
          </div>
          <ul className="mt-2 space-y-2">
            {bought.map((item) => (
              <Card as="li" key={item.id} muted flat className="flex items-center gap-3">
                <form
                  action={async (fd) => {
                    setBought({ id: item.id, bought: false });
                    await untickItem(fd);
                  }}
                >
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    className={tickClass}
                    aria-label={`Mark ${item.name} as not bought`}
                    title="Undo — mark as not bought"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-onaccent">
                      ✓
                    </span>
                  </button>
                </form>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium line-through">{item.name}</span>
                  {item.note && <span className="block text-xs text-inkmuted line-through">{item.note}</span>}
                </span>
                <span className="shrink-0 text-xs text-inkmuted">
                  bought by {names[item.boughtBy ?? -1] ?? "?"}
                </span>
              </Card>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
