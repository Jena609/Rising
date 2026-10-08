"use client";

import { useState } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ActionErrorNotice } from "@/components/ActionErrorNotice";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useRising } from "@/components/RisingProvider";
import { useWallet } from "@/components/WalletProvider";
import { fieldClass, labelClass, primaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import { validateChallenge, type ChallengeValue } from "@/lib/validation";

export function ChallengeForm() {
  const wallet = useWallet();
  const { session, busy, submitChallenge } = useRising();
  const [form, setForm] = useState({
    evaluationId: session.evaluations[0]?.id ?? "",
    alternativeEvidenceUrl: "",
    secondEvidenceUrl: "",
    reason: "",
    acknowledged: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ChallengeValue | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const known = risingConfig.liveReady ? null : session.evaluations.map((item) => item.id);
    const result = validateChallenge(form, known);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPending(result.value);
    setOpen(true);
  }

  return (
    <NetworkGuard>
      <form id="action-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className={labelClass} htmlFor="evaluation-id">Evaluation ID</label>
          <input id="evaluation-id" className={fieldClass} value={form.evaluationId} onChange={(event) => setForm({ ...form, evaluationId: event.target.value })} />
          {errors.evaluationId ? <p className="mt-1 text-sm text-rose-800">{errors.evaluationId}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="alt-url">Alternative evidence URL</label>
          <input id="alt-url" className={fieldClass} value={form.alternativeEvidenceUrl} placeholder="https://rising-kira-68d0.vercel.app/evidence/r58-a.txt" onChange={(event) => setForm({ ...form, alternativeEvidenceUrl: event.target.value })} />
          {errors.alternativeEvidenceUrl ? <p className="mt-1 text-sm text-rose-800">{errors.alternativeEvidenceUrl}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="second-url">Optional second evidence URL</label>
          <input id="second-url" className={fieldClass} value={form.secondEvidenceUrl} onChange={(event) => setForm({ ...form, secondEvidenceUrl: event.target.value })} />
          {errors.secondEvidenceUrl ? <p className="mt-1 text-sm text-rose-800">{errors.secondEvidenceUrl}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="reason">Reason for challenge</label>
          <textarea id="reason" className={`${fieldClass} min-h-28`} value={form.reason} placeholder="The reservoir source appears stale. This alternative source shows a newer reading." onChange={(event) => setForm({ ...form, reason: event.target.value })} />
          {errors.reason ? <p className="mt-1 text-sm text-rose-800">{errors.reason}</p> : null}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={form.acknowledged} onChange={(event) => setForm({ ...form, acknowledged: event.target.checked })} />
          <span>I understand this challenge will not instantly change the current allocation.</span>
        </label>
        {errors.acknowledged ? <p className="text-sm text-rose-800">{errors.acknowledged}</p> : null}
        <ActionErrorNotice />
        <button className={primaryButton} type="submit" disabled={busy || (risingConfig.liveReady && !wallet.ready)}>
          {busy ? "Working..." : "Challenge Decision"}
        </button>
      </form>
      <ConfirmationModal
        open={open}
        title="Submit a challenge"
        body={
          risingConfig.liveReady
            ? "Your challenge will be recorded for review. It will not instantly change the current allocation."
            : "Your challenge will be recorded for review. It will not instantly change the current allocation. In Demo Mode this is a Demo Challenge stored only in this browser."
        }
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          if (pending) void submitChallenge(pending);
        }}
      />
    </NetworkGuard>
  );
}
