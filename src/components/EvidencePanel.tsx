"use client";

import { EvidenceSourceCard } from "@/components/EvidenceSourceCard";
import { useRising } from "@/components/RisingProvider";
import { assessEvidence, CONFLICT_MESSAGE, INSUFFICIENT_MESSAGE } from "@/lib/evidence";
import { DEMO_DATA_LABEL } from "@/lib/policy";
import { getScenario } from "@/lib/scenarios";
import { risingConfig } from "@/lib/config";

export function EvidencePanel() {
  const { session } = useRising();
  const latest = session.evaluations[0];
  const sources = latest?.sources.length ? latest.sources : getScenario(session.scenarioId).sources;
  const assessment = assessEvidence(sources);
  return (
    <section aria-labelledby="evidence-heading">
      <div className="mb-4">
        <h2 id="evidence-heading" className="font-serif text-2xl text-navy">
          Evidence sources
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {risingConfig.liveReady
            ? "Submitted evidence URLs are listed with the evaluation. Rising does not treat a frontend drought stage as the contract result."
            : DEMO_DATA_LABEL}
        </p>
      </div>
      {assessment.status === "conflict" ? (
        <p className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-950" role="status">
          {CONFLICT_MESSAGE}
        </p>
      ) : null}
      {assessment.status === "insufficient" ? (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-800" role="status">
          {INSUFFICIENT_MESSAGE}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {sources.map((source) => (
          <EvidenceSourceCard key={source.id} source={source} />
        ))}
      </div>
      {latest && latest.sources.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          The latest live evaluation did not return evidence records. Submitted URLs: {latest.submittedUrls.join(", ") || "none"}.
        </p>
      ) : null}
    </section>
  );
}
