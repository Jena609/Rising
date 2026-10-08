"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ActionErrorNotice } from "@/components/ActionErrorNotice";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useRising } from "@/components/RisingProvider";
import { useWallet } from "@/components/WalletProvider";
import { fieldClass, labelClass, primaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import { DEMO_DATA_LABEL, POLICY_VERSION } from "@/lib/policy";
import { EVALUATION_NOT_CONFIGURED } from "@/lib/studio-next";
import { getScenario } from "@/lib/scenarios";
import { validateEvidenceUrls } from "@/lib/validation";

export function EvaluationRequestPanel() {
  const wallet = useWallet();
  const { session, busy, requestEvaluation } = useRising();
  const scenario = getScenario(session.scenarioId);
  const initialUrls = useMemo(() => scenario.sources.map((source) => source.url).join("\n"), [scenario]);
  const [text, setText] = useState(initialUrls);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    setText(initialUrls);
  }, [initialUrls]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateEvidenceUrls(text.split(/\s+/));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setUrls(result.urls);
    setOpen(true);
  }

  return (
    <NetworkGuard>
      <form id="action-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {risingConfig.liveReady ? (
          <p className="text-sm text-navy">
            Live Mode sends the URLs below to the configured contract. The contract fetches each page. A word in the URL is not a drought stage.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy">{EVALUATION_NOT_CONFIGURED}</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-muted">Reservoir: </span>{scenario.reservoirPercent === null ? "Not agreed" : `${scenario.reservoirPercent}%`}</p>
              <p><span className="text-muted">River flow: </span>{scenario.riverFlowStatus}</p>
              <p><span className="text-muted">Evidence: </span>{scenario.evidenceStatus}</p>
              <p><span className="text-muted">Policy: </span>{POLICY_VERSION}</p>
            </div>
          </div>
        )}
        <p className="text-sm text-muted">
          {risingConfig.liveReady
            ? "The contract reads the reservoir percentage on each fetched page. It must return that stage before a final allocation is shown."
            : `${DEMO_DATA_LABEL} Demo Mode does not retrieve these URLs. The preview uses the selected fictional scenario.`}
        </p>
        <div>
          <label className={labelClass} htmlFor="evidence-urls">
            Evidence URLs
          </label>
          <textarea id="evidence-urls" className={`${fieldClass} min-h-32`} value={text} onChange={(event) => setText(event.target.value)} />
        </div>
        {error ? <p className="text-sm text-rose-800">{error}</p> : null}
        <ActionErrorNotice />
        <button className={primaryButton} type="submit" disabled={busy || !session.participant || (risingConfig.liveReady && !wallet.ready)}>
          {busy ? "Working..." : "Request Drought Evaluation"}
        </button>
        {!session.participant ? <p className="text-sm text-muted">Register an entitlement before requesting an evaluation.</p> : null}
      </form>
      <ConfirmationModal
        open={open}
        title="Request drought evaluation"
        body={
          risingConfig.liveReady
            ? "You are requesting a GenLayer Studio Next drought evaluation. This may require a testnet transaction and validator processing time. Continue?"
            : "You are requesting a GenLayer Studio Next drought evaluation. This may require a testnet transaction and validator processing time. Continue? Demo Mode will only simulate this step and will not open your wallet."
        }
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          void requestEvaluation(urls);
        }}
      />
    </NetworkGuard>
  );
}
