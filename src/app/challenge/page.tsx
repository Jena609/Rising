"use client";

import { BasinNotice } from "@/components/BasinStatusCard";
import { ChallengeForm } from "@/components/ChallengeForm";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionStatus } from "@/components/TransactionStatus";
import { cardClass } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";
import { formatDateTime } from "@/lib/format";

export default function ChallengePage() {
  const { session } = useRising();
  const latest = session.transactions.find((item) => item.action === "Challenge Evaluation") ?? null;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Challenge"
        title="Challenge Decision"
        lede="Ask for review with alternative evidence. The current allocation stays in place."
      />
      <BasinNotice />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <ChallengeForm />
        </section>
        <div className="space-y-4">
          {session.challenges.length === 0 ? (
            <EmptyState title="No challenges" body="A challenge appears here after you submit the form. Demo challenges are labeled Demo Challenge." />
          ) : (
            session.challenges.map((challenge) => (
              <article key={challenge.id} className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-navy">{challenge.evaluationId}</h2>
                  <StatusBadge label={challenge.statusLabel} />
                </div>
                <p className="mt-2 text-sm">{challenge.reason}</p>
                <p className="mt-2 break-all text-sm text-water">{challenge.alternativeEvidenceUrl}</p>
                {challenge.secondEvidenceUrl ? <p className="break-all text-sm text-muted">{challenge.secondEvidenceUrl}</p> : null}
                <p className="mt-2 text-sm">{challenge.message}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(challenge.createdAt)}</p>
              </article>
            ))
          )}
          <TransactionStatus record={latest} />
        </div>
      </div>
    </div>
  );
}
