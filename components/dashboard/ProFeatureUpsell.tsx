import Link from "next/link";

export default function ProFeatureUpsell({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-violet-200 bg-violet-50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className={`font-semibold text-violet-950 ${compact ? "text-sm" : ""}`}>
        {title}
      </p>
      <p className={`mt-1 text-violet-900 ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
      <Link
        href="/dashboard/settings#plano"
        className={`mt-2 inline-flex font-semibold text-brand hover:text-brand-dark ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        Fazer upgrade para Pro →
      </Link>
    </div>
  );
}
