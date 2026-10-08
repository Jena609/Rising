"use client";

import { AllocationCard } from "@/components/AllocationCard";
import { BasinNotice } from "@/components/BasinStatusCard";
import { EvaluationRequestPanel } from "@/components/EvaluationRequestPanel";
import { EvaluationStatus } from "@/components/EvaluationStatus";
import { PageHeader } from "@/components/PageHeader";
import { TransactionStatus } from "@/components/TransactionStatus";
import { cardClass } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";

export default function EvaluationPage() {
  const { session } = useRising();
  const latest = session.transactions.find((item) => item.action === "Request Drought Evaluation") ?? null;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evaluation"
        title="Request Drought Evaluation"
        lede="Submit evidence references and follow the real transaction only when Live Mode is configured."
      />
      <BasinNotice />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <EvaluationRequestPanel />
        </section>
        <EvaluationStatus />
      </div>
      <AllocationCard />
      <TransactionStatus record={latest} />
    </div>
  );
}
