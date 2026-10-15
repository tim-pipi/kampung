import { requireMember } from "@/lib/guard";
import { PageHeader } from "@/components/PageHeader";
import { NavTile } from "@/components/NavTile";
import { SubmitButton } from "@/components/SubmitButton";
import { logout } from "../../actions";

export const dynamic = "force-dynamic";

export default async function More({ params }: { params: { slug: string } }) {
  const { me } = await requireMember(params.slug);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader title="More" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <NavTile
          href={`/h/${params.slug}/app/recurring`}
          label="Recurring bills"
          description="Auto-posted monthly"
        />
        <NavTile
          href={`/h/${params.slug}/app/members`}
          label="Members"
          description="House roster"
        />
        <NavTile
          href={`/h/${params.slug}/app/telegram`}
          label="Telegram"
          description="Notifications"
        />
      </div>

      <section className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
        <span className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: me.color }} />
          Signed in as <strong>{me.username}</strong>
        </span>
        <form action={logout}>
          <input type="hidden" name="slug" value={params.slug} />
          <SubmitButton className="btn-ghost px-3 py-1.5 text-sm" pendingLabel="Logging out…">
            Log out
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
