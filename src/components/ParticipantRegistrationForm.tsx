"use client";

import { useState } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ActionErrorNotice } from "@/components/ActionErrorNotice";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useRising } from "@/components/RisingProvider";
import { useWallet } from "@/components/WalletProvider";
import { fieldClass, labelClass, primaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import type { ParticipantType } from "@/lib/types";
import { validateRegistration, type RegistrationValue } from "@/lib/validation";

const initial = {
  participantType: "" as ParticipantType | "",
  participantLabel: "",
  baseEntitlement: "",
  acknowledged: false,
};

export function ParticipantRegistrationForm() {
  const wallet = useWallet();
  const { busy, registerParticipant } = useRising();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<RegistrationValue | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateRegistration(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPendingValue(result.value);
    setOpen(true);
  }

  return (
    <NetworkGuard>
      <form id="action-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="basin">
            Basin
          </label>
          <input id="basin" className={fieldClass} value="Green Valley Basin" readOnly />
        </div>
        <fieldset>
          <legend className={labelClass}>Participant type</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(["household", "farm", "industrial"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="participantType"
                  value={type}
                  checked={form.participantType === type}
                  onChange={() => setForm({ ...form, participantType: type })}
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
          {errors.participantType ? <p className="mt-1 text-sm text-rose-800">{errors.participantType}</p> : null}
        </fieldset>
        <div>
          <label className={labelClass} htmlFor="label">
            Participant label
          </label>
          <input
            id="label"
            className={fieldClass}
            value={form.participantLabel}
            placeholder="Farm 004"
            onChange={(event) => setForm({ ...form, participantLabel: event.target.value })}
          />
          <p className="mt-1 text-xs text-muted">Use a fictional label. Do not enter a legal name or other sensitive information.</p>
          {errors.participantLabel ? <p className="mt-1 text-sm text-rose-800">{errors.participantLabel}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="entitlement">
            Base entitlement (water units)
          </label>
          <input
            id="entitlement"
            className={fieldClass}
            inputMode="numeric"
            value={form.baseEntitlement}
            onChange={(event) => setForm({ ...form, baseEntitlement: event.target.value })}
          />
          {errors.baseEntitlement ? <p className="mt-1 text-sm text-rose-800">{errors.baseEntitlement}</p> : null}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.acknowledged}
            onChange={(event) => setForm({ ...form, acknowledged: event.target.checked })}
          />
          <span>I understand that this is a testnet simulation and does not create legal water rights.</span>
        </label>
        {errors.acknowledged ? <p className="text-sm text-rose-800">{errors.acknowledged}</p> : null}
        <ActionErrorNotice />
        <button type="submit" className={primaryButton} disabled={busy || (risingConfig.liveReady && !wallet.ready)}>
          {busy ? "Working..." : risingConfig.liveReady ? "Review registration" : "Preview registration"}
        </button>
      </form>
      <ConfirmationModal
        open={open}
        title="Register fictional entitlement"
        body={
          risingConfig.liveReady
            ? "You are registering a fictional water entitlement on the Rising GenLayer Studio Next testnet. This does not create legal water rights. Continue?"
            : "You are registering a fictional water entitlement on the Rising GenLayer Studio Next testnet. This does not create legal water rights. Continue? Demo Mode will only simulate this step and will not open your wallet."
        }
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          if (pendingValue) void registerParticipant(pendingValue);
        }}
      />
    </NetworkGuard>
  );
}
