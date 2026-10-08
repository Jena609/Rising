"use client";

import { StageBadge, StatusBadge } from "@/components/StatusBadge";
import { cardClass } from "@/components/styles";
import { assessEvidence } from "@/lib/evidence";
import { risingConfig } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { BASIN_NAME, BASIN_WARNING, DEMO_DATA_LABEL, POLICY_VERSION, stageFromReservoir } from "@/lib/policy";
import { DEMO_LAST_EVALUATION, DEMO_NEXT_EVALUATION, getScenario } from "@/lib/scenarios";
import { useRising } from "@/components/RisingProvider";

export function BasinNotice() {
  return (
    <p className="rounded-xl border border-sky-200 bg-foam px-3 py-2 text-sm text-navy" role="note">
      {BASIN_WARNING}
    </p>
  );
}

export function BasinStatusCard() {
  const { session } = useRising();
  const scenario = getScenario(session.scenarioId);
  const assessment = assessEvidence(scenario.sources);
  const stage = assessment.stage ?? (scenario.reservoirPercent !== null ? stageFromReservoir(scenario.reservoirPercent) : null);
  const demo = !risingConfig.liveReady;
  const reservoir = demo ? scenario.reservoirPercent : session.allocation ? null : null;
  const shownReservoir = demo ? scenario.reservoirPercent : session.evaluations[0]?.reservoirPercent ?? null;
  const shownStage = demo ? (assessment.canUpdateAllocation ? stage : null) : session.allocation?.stage ?? null;
  const river = demo ? scenario.riverFlowStatus : session.evaluations[0]?.riverFlowStatus ?? "Not available";
  const evidenceLabel =
    (demo ? assessment.status : session.evaluations[0]?.evidenceStatus ?? "insufficient") === "conflict"
      ? "Disputed"
      : (demo ? assessment.status : session.evaluations[0]?.evidenceStatus) === "insufficient"
        ? "Inconclusive"
        : "Available";

  return (
    <section className={cardClass} aria-labelledby="basin-status-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="basin-status-heading" className="font-serif text-2xl text-navy">
            {BASIN_NAME}
          </h2>
          <p className="mt-1 text-sm text-muted">{demo ? DEMO_DATA_LABEL : "Live contract view"}</p>
        </div>
        <StatusBadge label={demo ? "Demo" : "Live"} />
      </div>
      <div className="mt-4">
        <BasinNotice />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Drought stage</dt>
          <dd className="mt-1">{shownStage ? <StageBadge stage={shownStage} /> : <StatusBadge label={evidenceLabel} />}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Reservoir</dt>
          <dd className="mt-1 text-lg font-semibold text-navy">{shownReservoir === null ? "Not available" : `${shownReservoir}%`}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">River flow</dt>
          <dd className="mt-1 text-navy">{river}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Evidence status</dt>
          <dd className="mt-1">
            <StatusBadge label={evidenceLabel} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last evaluation</dt>
          <dd className="mt-1 text-sm">{demo ? `${formatDateTime(DEMO_LAST_EVALUATION)} (demo schedule)` : formatDateTime(session.evaluations[0]?.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Next evaluation</dt>
          <dd className="mt-1 text-sm">{demo ? `${formatDateTime(DEMO_NEXT_EVALUATION)} (demo schedule)` : "Set by the contract, when available"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Policy</dt>
          <dd className="mt-1 text-sm">{POLICY_VERSION}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Allocation summary</dt>
          <dd className="mt-1 text-sm">
            {session.allocation
              ? `${session.allocation.waterUnits.toLocaleString("en-US")} water units`
              : "No allocation is active yet."}
          </dd>
        </div>
      </dl>
      {shownReservoir !== null ? (
        <div className="mt-4" aria-hidden="true">
          <div className="h-3 overflow-hidden rounded-full bg-foam">
            <div className="h-full rounded-full bg-water" style={{ width: `${Math.max(0, Math.min(100, shownReservoir))}%` }} />
          </div>
        </div>
      ) : null}
      {reservoir === null && demo && assessment.status !== "consistent" ? (
        <p className="mt-4 text-sm text-navy">{assessment.message}</p>
      ) : null}
    </section>
  );
}
