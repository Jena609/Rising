import { StatusBadge } from "@/components/StatusBadge";
import { cardClass } from "@/components/styles";
import { formatDateTime } from "@/lib/format";
import type { EvidenceSource } from "@/lib/types";
import { safeHttpUrl } from "@/lib/urls";

const freshnessLabel = {
  fresh: "Fresh",
  stale: "Stale",
  missing: "Missing",
} as const;

export function EvidenceSourceCard({ source }: { source: EvidenceSource }) {
  const href = safeHttpUrl(source.url);
  const statusLabel = source.freshness === "stale" ? "Stale" : source.status === "available" ? "Available" : "Unavailable";
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-navy">{source.name}</h3>
        <StatusBadge label={source.role === "primary" ? "Primary source" : "Secondary source"} />
      </div>
      <p className="mt-2 text-sm text-muted">Fictional demonstration source. Not a government reading.</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Value</dt>
          <dd className="font-semibold text-navy">{source.valueLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Unit</dt>
          <dd>{source.unit}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Observed</dt>
          <dd>{formatDateTime(source.observedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Retrieved</dt>
          <dd>{formatDateTime(source.retrievedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Freshness</dt>
          <dd>{freshnessLabel[source.freshness]}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Source status</dt>
          <dd>{statusLabel}</dd>
        </div>
      </dl>
      {href ? (
        <a className="mt-3 block break-all text-sm font-semibold text-water" href={href} target="_blank" rel="noreferrer">
          {href}
        </a>
      ) : (
        <p className="mt-3 text-sm text-muted">This source URL is not available.</p>
      )}
    </article>
  );
}
