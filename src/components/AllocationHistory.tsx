"use client";

import { EmptyState } from "@/components/EmptyState";
import { cardClass } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";
import { formatDateTime, formatWaterUnits } from "@/lib/format";
import { stageLabel } from "@/lib/policy";

export function AllocationHistory() {
  const { session } = useRising();
  const rows = session.allocationHistory;
  return (
    <section className={cardClass} aria-labelledby="allocation-history-heading">
      <h2 id="allocation-history-heading" className="font-serif text-2xl text-navy">
        Allocation record
      </h2>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No allocation record" body="Applied allocations appear here. Disputed and insufficient results are not added." />
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={`${row.evaluationId}-${row.appliedAt}`} className="rounded-xl border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-navy">{formatWaterUnits(row.waterUnits)} water units</span>
                <span>{stageLabel(row.stage)}</span>
              </div>
              <p className="mt-1 text-muted">
                {row.source === "demo" ? "Demo result" : "Contract stage"} · {formatDateTime(row.appliedAt)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-foam" aria-hidden="true">
                <div
                  className="h-full bg-water"
                  style={{ width: `${Math.min(100, (row.waterUnits / Math.max(row.baseEntitlement, 1)) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
