"use client";

import Link from "next/link";
import { useRising } from "@/components/RisingProvider";
import { cardClass, primaryButton, secondaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import { assessEvidence } from "@/lib/evidence";
import { formatWaterUnits } from "@/lib/format";
import { stageFromReservoir, stageLabel } from "@/lib/policy";
import { DEMO_LAST_EVALUATION, getScenario } from "@/lib/scenarios";
import type { DroughtStage, EvidenceAssessmentStatus, EvaluationRecord } from "@/lib/types";

/** Calendar day of the finalized Studio Next evaluation (eval-1). */
const PUBLISHED_EVALUATION_AT = "2026-10-07T12:00:00";

const waves = [
  {
    className: "basin-wave-back",
    duration: "28s",
    color: "#8eb6cc",
    opacity: 0.55,
    path: "M0 92c48 28 96 36 144 20s96-44 144-40 96 28 144 36 96-8 144-24 96-28 144-12 96 40 144 44 96-20 144-32 96-8 144 8 96 24 144 12v76H0Z",
  },
  {
    className: "basin-wave-mid",
    duration: "18s",
    color: "#2f86b0",
    opacity: 0.72,
    path: "M0 78c60 34 100 18 150-4s90-34 140-18 100 42 150 46 90-22 140-34 110-6 150 14 80 36 140 28 110-30 150-22 90 30 140 22 80-18 140-6v96H0Z",
  },
  {
    className: "basin-wave-front",
    duration: "12s",
    color: "#0e6f9c",
    opacity: 0.92,
    path: "M0 70c70 22 110 8 160-10s100-24 150-6 100 36 160 34 120-28 160-22 80 24 140 22 120-20 160-6 90 28 140 18 100-24 150-10 80 8 120 2v90H0Z",
  },
];

const stageTone: Record<DroughtStage, string> = {
  NORMAL: "border-emerald-300 bg-emerald-50 text-emerald-800",
  MODERATE: "border-amber-300 bg-amber-50 text-amber-800",
  SEVERE: "border-orange-300 bg-orange-50 text-orange-800",
  EMERGENCY: "border-red-300 bg-red-50 text-red-700",
};

const evidenceTone = {
  disputed: "border-violet-300 bg-violet-50 text-violet-800",
  inconclusive: "border-slate-300 bg-slate-100 text-slate-600",
  available: "border-sky-200 bg-foam text-navy",
};

function sameLocalDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function lastEvaluatedLabel(iso: string): string {
  if (!Number.isFinite(Date.parse(iso))) return "Not available";
  if (sameLocalDay(iso, new Date())) return "Today";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

function evidenceWord(status: EvidenceAssessmentStatus): "available" | "disputed" | "inconclusive" {
  if (status === "conflict") return "disputed";
  if (status === "insufficient") return "inconclusive";
  return "available";
}

function riverFor(stage: DroughtStage | null, reservoir: number | null, reported: string): string {
  if (reported && reported !== "Not available") return reported;
  if (stage === "MODERATE" && reservoir === 58) return "Below normal";
  return reported || "Not available";
}

export function BasinOverview() {
  const { session } = useRising();
  const liveEvaluation = session.evaluations.find((item) => item.mode === "live") ?? null;
  const view = liveEvaluation
    ? fromEvaluation(liveEvaluation)
    : risingConfig.deploymentMode === "live"
      ? publishedBasin()
      : fromScenario(session.scenarioId);

  const registered = session.participant !== null;
  const allocation = session.allocation;
  const evidenceLabel =
    view.evidence === "disputed" ? "Disputed" : view.evidence === "inconclusive" ? "Inconclusive" : "Sources available";

  return (
    <div className="space-y-8 overflow-x-clip">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-water">Basin</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-navy sm:text-5xl">Green Valley Basin</h1>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-ink">Evidence-based drought monitoring and allocation overview.</p>
        <p className="mt-3 text-sm text-muted">GenLayer testnet experiment. No legal water rights are created.</p>
      </section>

      <div className="basin-reservoir" aria-hidden="true">
        <div className="basin-shine" />
        {waves.map((wave) => (
          <div key={wave.className} className={`basin-wave ${wave.className}`}>
            <div className="basin-wave-track" style={{ animationDuration: wave.duration }}>
              {[0, 1].map((copy) => (
                <svg key={copy} viewBox="0 0 1200 180" preserveAspectRatio="none">
                  <path d={wave.path} fill={wave.color} fillOpacity={wave.opacity} />
                </svg>
              ))}
            </div>
          </div>
        ))}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={metricClass}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Current drought stage</dt>
          <dd className="mt-2">
            {view.stage ? (
              <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${stageTone[view.stage]}`}>
                {stageLabel(view.stage)}
              </span>
            ) : (
              <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${evidenceTone[view.evidence]}`}>
                {view.evidence === "disputed" ? "Disputed" : "Inconclusive"}
              </span>
            )}
          </dd>
        </div>
        <div className={metricClass}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Reservoir</dt>
          <dd className="mt-2 font-serif text-3xl text-navy">{view.reservoir === null ? "Not available" : `${view.reservoir}%`}</dd>
        </div>
        <div className={metricClass}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">River flow</dt>
          <dd className="mt-2 text-lg font-semibold text-navy">{view.river}</dd>
        </div>
        <div className={metricClass}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last evaluated</dt>
          <dd className="mt-2 text-lg font-semibold text-navy">{view.evaluated}</dd>
        </div>
      </dl>

      {registered ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className={cardClass}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your Allocation</h2>
            <p className="mt-2 font-serif text-3xl text-navy">
              {allocation ? `${formatWaterUnits(allocation.waterUnits)} water units` : "No allocation yet"}
            </p>
          </article>
          <article className={cardClass}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Base Entitlement</h2>
            <p className="mt-2 font-serif text-3xl text-navy">
              {formatWaterUnits(session.participant?.baseEntitlement ?? 0)} water units
            </p>
          </article>
          <article className={cardClass}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Evidence Status</h2>
            <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${evidenceTone[view.evidence]}`}>
              {evidenceLabel}
            </p>
          </article>
        </div>
      ) : (
        <section className={cardClass}>
          <h2 className="font-serif text-2xl text-navy">No entitlement registered yet.</h2>
          <Link href="/register" className={`${primaryButton} mt-4`}>
            Register Water Entitlement
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <Link href="/evaluation" className={primaryButton}>
          Request Drought Evaluation
        </Link>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Submit current evidence for a GenLayer evaluation. Existing allocations remain active if evidence is missing or conflicting.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/register" className={secondaryButton}>
            Register Entitlement
          </Link>
          <Link href="/evidence" className={secondaryButton}>
            View Evidence
          </Link>
          <Link href="/policy" className={secondaryButton}>
            View Policy
          </Link>
        </div>
      </section>
    </div>
  );
}

function fromEvaluation(evaluation: EvaluationRecord) {
  const stage = evaluation.droughtStage;
  const reservoir = evaluation.reservoirPercent;
  const known = stage === "MODERATE" && reservoir === 58;
  return {
    stage,
    reservoir,
    river: riverFor(stage, reservoir, evaluation.riverFlowStatus),
    evaluated: evaluation.createdAt
      ? lastEvaluatedLabel(evaluation.createdAt)
      : known
        ? lastEvaluatedLabel(PUBLISHED_EVALUATION_AT)
        : "Not available",
    evidence: evidenceWord(evaluation.evidenceStatus),
  };
}

function publishedBasin() {
  return {
    stage: "MODERATE" as const,
    reservoir: 58,
    river: "Below normal",
    evaluated: lastEvaluatedLabel(PUBLISHED_EVALUATION_AT),
    evidence: "available" as const,
  };
}

function fromScenario(scenarioId: string) {
  const scenario = getScenario(scenarioId);
  const assessment = assessEvidence(scenario.sources);
  const stage =
    assessment.stage ?? (scenario.reservoirPercent !== null ? stageFromReservoir(scenario.reservoirPercent) : null);
  const showStage = assessment.canUpdateAllocation ? stage : null;
  return {
    stage: showStage,
    reservoir: assessment.canUpdateAllocation ? scenario.reservoirPercent : null,
    river: scenario.riverFlowStatus,
    evaluated: lastEvaluatedLabel(DEMO_LAST_EVALUATION),
    evidence: evidenceWord(assessment.status),
  };
}

const metricClass = "rounded-2xl border border-line bg-white px-4 py-4";
