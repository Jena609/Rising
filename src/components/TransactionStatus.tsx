"use client";

import { ExplorerLink } from "@/components/ExplorerLink";
import { StatusBadge } from "@/components/StatusBadge";
import { secondaryButton } from "@/components/styles";
import { useRising } from "@/components/RisingProvider";
import type { TransactionRecord } from "@/lib/types";

const phaseLabel: Record<TransactionRecord["phase"], string> = {
  preview: "Preview action",
  "wallet-approval": "Wallet approval required",
  submitted: "Transaction submitted",
  waiting: "Waiting for confirmation",
  processing: "Demo processing",
  "demo-result": "Demo result",
  completed: "Demo completed",
  confirmed: "Confirmed",
  failed: "Failed",
};

export function TransactionStatus({ record }: { record: TransactionRecord | null }) {
  const { busy, checkTransaction, releaseLocalWait } = useRising();
  if (!record) return null;
  return (
    <article className="rounded-2xl border border-line bg-white p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-navy">{record.action}</h3>
        <StatusBadge label={record.mode === "demo" ? "Simulation only" : phaseLabel[record.phase]} />
      </div>
      <p className="mt-2 text-sm text-ink">{phaseLabel[record.phase]}</p>
      {record.phase === "wallet-approval" ? <p className="text-sm">Please confirm the transaction in your wallet.</p> : null}
      <ol className="mt-3 space-y-2">
        {record.steps.map((step) => (
          <li key={step.id} className="text-sm">
            <span className="font-semibold text-navy">{step.label}.</span> {step.detail}
            <span className="ml-2 text-xs uppercase text-muted">{step.state}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3">
        <ExplorerLink hash={record.hash} />
      </div>
      {typeof record.confirmations === "number" ? <p className="mt-2 text-sm">Confirmations: {record.confirmations}</p> : null}
      <p className="mt-2 text-sm">Result: {record.evaluationResult ?? "Not available"}</p>
      <p className="text-sm">Finality: {record.finalityStatus}</p>
      <p className="text-sm">Validators: {record.validatorStatus}</p>
      {record.errorMessage ? <p className="mt-2 text-sm text-rose-800">{record.errorMessage}</p> : null}
      {record.technicalDetail ? (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-semibold">Technical details</summary>
          <p className="mt-1 break-words font-mono text-xs">{record.technicalDetail}</p>
        </details>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {record.phase === "failed" ? (
          <a className={secondaryButton} href="#action-form">
            Try Again
          </a>
        ) : null}
        {record.mode === "live" && record.hash && record.phase !== "confirmed" ? (
          <button type="button" className={secondaryButton} disabled={busy} onClick={() => void checkTransaction(record.id)}>
            Check status
          </button>
        ) : null}
        {record.mode === "live" && record.phase === "waiting" && !record.released ? (
          <button type="button" className={secondaryButton} onClick={() => releaseLocalWait(record.id)}>
            Release local wait
          </button>
        ) : null}
      </div>
    </article>
  );
}
