"use client";

import { StageBadge, StatusBadge } from "@/components/StatusBadge";
import { WalletAddressDisplay } from "@/components/WalletAddressDisplay";
import { cardClass } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";
import { formatWaterUnits } from "@/lib/format";
import { formatMultiplier, participantTypeLabel, POLICY_VERSION } from "@/lib/policy";
import { risingConfig } from "@/lib/config";

export function AllocationCard() {
  const { session } = useRising();
  const participant = session.participant;
  const allocation = session.allocation;
  return (
    <section className={cardClass} aria-labelledby="allocation-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="allocation-heading" className="font-serif text-2xl text-navy">
          Your allocation
        </h2>
        <StatusBadge label={allocation?.source === "contract" ? "Contract" : allocation?.source === "demo" ? "Demo result" : "No result"} />
      </div>
      {!participant || !allocation ? (
        <p className="mt-3 text-sm leading-6 text-muted">
          No allocation is active. Register a fictional entitlement and request an evaluation. A disputed or incomplete
          result will not change the previous allocation.
        </p>
      ) : (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Wallet</dt>
            <dd className="mt-1">{participant.walletAddress ? <WalletAddressDisplay /> : "Demo session, no wallet"}</dd>
          </div>
          <div>
            <dt className="text-muted">Participant</dt>
            <dd className="mt-1 font-semibold text-navy">
              {participantTypeLabel(participant.participantType)} · {participant.participantLabel}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Basin</dt>
            <dd className="mt-1">{participant.basinName}</dd>
          </div>
          <div>
            <dt className="text-muted">Base entitlement</dt>
            <dd className="mt-1">{formatWaterUnits(participant.baseEntitlement)} water units</dd>
          </div>
          <div>
            <dt className="text-muted">Drought stage</dt>
            <dd className="mt-1">
              <StageBadge stage={allocation.stage} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">Multiplier</dt>
            <dd className="mt-1">{formatMultiplier(allocation.multiplierBps)}</dd>
          </div>
          <div>
            <dt className="text-muted">Current allocation</dt>
            <dd className="mt-1 text-2xl font-semibold text-navy">{formatWaterUnits(allocation.waterUnits)} water units</dd>
          </div>
          <div>
            <dt className="text-muted">Previous allocation</dt>
            <dd className="mt-1">
              {allocation.previousWaterUnits === null ? "None" : `${formatWaterUnits(allocation.previousWaterUnits)} water units`}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Change</dt>
            <dd className="mt-1">
              {allocation.previousWaterUnits === null
                ? "No earlier allocation"
                : `${formatWaterUnits(allocation.waterUnits - allocation.previousWaterUnits)} water units`}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Policy</dt>
            <dd className="mt-1">{POLICY_VERSION}</dd>
          </div>
        </dl>
      )}
      {allocation?.source === "demo" ? (
        <p className="mt-3 text-xs text-muted">Demo data — not a live water-management decision. {risingConfig.deploymentMode === "demo" ? "Simulation only." : ""}</p>
      ) : null}
    </section>
  );
}
