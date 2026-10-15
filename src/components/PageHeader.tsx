import Link from "next/link";

export function PageHeader({
  backHref,
  backLabel = "← Back to dashboard",
  title,
  description,
  action,
}: {
  // Omit on tab-root pages: the bottom nav is the way out, not a back link.
  backHref?: string;
  backLabel?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      {backHref && (
        <Link href={backHref} className="mb-2 inline-block text-sm text-inkmuted hover:underline">
          {backLabel}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
      {description && <p className="mt-1 text-sm text-inkmuted">{description}</p>}
    </div>
  );
}
