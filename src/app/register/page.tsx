"use client";

import { BasinNotice } from "@/components/BasinStatusCard";
import { PageHeader } from "@/components/PageHeader";
import { ParticipantCard } from "@/components/ParticipantCard";
import { ParticipantRegistrationForm } from "@/components/ParticipantRegistrationForm";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useRising } from "@/components/RisingProvider";
import { cardClass, secondaryButton } from "@/components/styles";

export default function RegisterPage() {
  const { session, clearLocalSession } = useRising();
  const latest = session.transactions.find((item) => item.action === "Register Water Entitlement") ?? null;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registration"
        title="Register Water Entitlement"
        lede="Create a fictional household, farm, or industrial entitlement. Water units are abstract. They are not acre-feet or a legal volume."
      />
      <BasinNotice />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className={cardClass}>
          <ParticipantRegistrationForm />
        </section>
        <div className="space-y-4">
          {session.participant ? <ParticipantCard participant={session.participant} /> : null}
          <TransactionStatus record={latest} />
        </div>
      </div>
      <button type="button" className={secondaryButton} onClick={clearLocalSession}>
        Clear local session
      </button>
    </div>
  );
}
