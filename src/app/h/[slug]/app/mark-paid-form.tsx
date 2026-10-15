"use client";

import { useOptimistic } from "react";
import { quickSettle } from "./actions";

// Shows "Paid ✓" the moment it's tapped; the revalidated dashboard then drops
// the row (or React reverts it if quickSettle throws).
export function MarkPaidForm({ slug, from, to, amountCents }: { slug: string; from: number; to: number; amountCents: number }) {
  const [paid, setPaid] = useOptimistic(false, () => true);

  return (
    <form
      action={async (fd) => {
        setPaid(null);
        await quickSettle(fd);
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="amountCents" value={amountCents} />
      <button type="submit" disabled={paid} className="btn-ghost px-3 py-1 text-sm disabled:border-accent disabled:text-accent">
        {paid ? "Paid ✓" : "Mark paid"}
      </button>
    </form>
  );
}
