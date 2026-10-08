"use client";

import { AllocationCard } from "@/components/AllocationCard";
import { BasinNotice, BasinStatusCard } from "@/components/BasinStatusCard";
import { PageHeader } from "@/components/PageHeader";
import { PolicyCard } from "@/components/PolicyCard";
import { useRising } from "@/components/RisingProvider";
import { cardClass } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import { DEMO_DATA_LABEL } from "@/lib/policy";
import { SCENARIOS } from "@/lib/scenarios";

export default function BasinPage() {
  const { session, setScenario } = useRising();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Basin"
        title="Green Valley Basin"
        lede="Review the fictional basin, the active allocation, and the policy multipliers."
      />
      <BasinNotice />
      {!risingConfig.liveReady ? (
        <section className={cardClass}>
          <h2 className="font-semibold text-navy">Preview a demo scenario</h2>
          <p className="mt-1 text-sm text-muted">{DEMO_DATA_LABEL} Changing the preview does not change a saved allocation.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                className={`rounded-xl border px-3 py-2 text-left text-sm ${session.scenarioId === scenario.id ? "border-water bg-foam" : "border-line bg-white"}`}
                onClick={() => setScenario(scenario.id)}
                aria-pressed={session.scenarioId === scenario.id}
              >
                <span className="font-semibold text-navy">{scenario.title}</span>
                <span className="mt-1 block text-muted">{scenario.summary}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted">Live Mode does not mix the fictional scenario switcher into the contract result.</p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <BasinStatusCard />
        <AllocationCard />
      </div>
      <PolicyCard />
    </div>
  );
}
