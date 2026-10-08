"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { cardClass } from "@/components/styles";
import type { ParticipantRecord } from "@/lib/types";
import { formatDateTime, formatWaterUnits } from "@/lib/format";
import { participantTypeLabel } from "@/lib/policy";
import { isTransactionHash } from "@/lib/urls";
import { ExplorerLink } from "@/components/ExplorerLink";

export function ParticipantCard({ participant }: { participant: ParticipantRecord }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl text-navy">Registered participant</h2>
        <StatusBadge
          label={
            participant.source === "demo"
              ? "Demo result"
              : participant.source === "contract"
                ? "Contract"
                : "Submitted, not read back"
          }
        />
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Wallet</dt>
          <dd className="break-all font-mono text-xs">{participant.walletAddress ?? "No wallet in this demo session"}</dd>
        </div>
        <div>
          <dt className="text-muted">Basin</dt>
          <dd>{participant.basinName}</dd>
        </div>
        <div>
          <dt className="text-muted">Type</dt>
          <dd>{participantTypeLabel(participant.participantType)}</dd>
        </div>
        <div>
          <dt className="text-muted">Label</dt>
          <dd>{participant.participantLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Base entitlement</dt>
          <dd>{formatWaterUnits(participant.baseEntitlement)} water units</dd>
        </div>
        <div>
          <dt className="text-muted">Registered</dt>
          <dd>{formatDateTime(participant.registeredAt)}</dd>
        </div>
      </dl>
      {participant.source === "submitted-unverified" ? (
        <p className="mt-3 text-sm text-amber-950">
          These are the values you submitted. Rising could not read them back from the contract, so they are not a confirmed record.
        </p>
      ) : null}
      {participant.source === "demo" ? (
        <p className="mt-3 text-sm text-muted">Simulation only. No blockchain transaction was submitted.</p>
      ) : null}
      <div className="mt-3 text-sm">
        <p className="text-muted">Transaction status</p>
        {isTransactionHash(participant.transactionHash) ? (
          <ExplorerLink hash={participant.transactionHash} />
        ) : participant.source === "contract" ? (
          <p>Read from the contract. This browser does not have the transaction hash.</p>
        ) : (
          <p>No transaction hash. Demo actions never receive one.</p>
        )}
      </div>
    </article>
  );
}
