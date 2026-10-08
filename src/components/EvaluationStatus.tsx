"use client";

import { ExplorerLink } from "@/components/ExplorerLink";
import { StageBadge, StatusBadge } from "@/components/StatusBadge";
import { cardClass } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export function EvaluationStatus() {
  const { session } = useRising();
  const evaluation = session.evaluations[0];
  if (!evaluation) {
    return <EmptyState title="No evaluation yet" body="Request a drought evaluation to see a demo result or a live transaction status." />;
  }
  return (
    <section className={cardClass} aria-labelledby="evaluation-status-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="evaluation-status-heading" className="font-serif text-2xl text-navy">
          Evaluation
        </h2>
        <StatusBadge label={evaluation.statusLabel} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Evaluation ID</dt>
          <dd className="break-all">{evaluation.contractEvaluationId ?? `${evaluation.id} (local reference)`}</dd>
        </div>
        <div>
          <dt className="text-muted">Drought stage</dt>
          <dd className="mt-1">{evaluation.droughtStage ? <StageBadge stage={evaluation.droughtStage} /> : "Not available"}</dd>
        </div>
        <div>
          <dt className="text-muted">Reservoir</dt>
          <dd>{evaluation.reservoirPercent === null ? "Not available" : `${evaluation.reservoirPercent}%`}</dd>
        </div>
        <div>
          <dt className="text-muted">River flow</dt>
          <dd>{evaluation.riverFlowStatus}</dd>
        </div>
        <div>
          <dt className="text-muted">Source conflict</dt>
          <dd>
            {evaluation.evidenceStatus === "conflict"
              ? "Sources conflict"
              : evaluation.evidenceStatus === "insufficient"
                ? "Evidence insufficient"
                : evaluation.mode === "demo"
                  ? "No conflict in the fictional preview"
                  : "Not reported by the contract"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Validator status</dt>
          <dd>{evaluation.validatorStatus}</dd>
        </div>
        <div>
          <dt className="text-muted">Finality</dt>
          <dd>{evaluation.finalityStatus}</dd>
        </div>
        <div>
          <dt className="text-muted">Appeal deadline</dt>
          <dd>{evaluation.appealDeadline ? formatDateTime(evaluation.appealDeadline) : "Not available"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-6">{evaluation.message}</p>
      <div className="mt-3">
        <ExplorerLink hash={evaluation.transactionHash} />
      </div>
      {evaluation.mode === "demo" ? (
        <p className="mt-3 text-xs text-muted">Demo data — not a live water-management decision. Simulation only.</p>
      ) : null}
    </section>
  );
}
