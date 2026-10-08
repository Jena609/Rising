import type { TimelineStep, TxPhase } from "@/lib/types";
import { isTransactionHash } from "@/lib/urls";

export const DEMO_STEP_DEFS = [
  { id: "preview", label: "Preview action" },
  { id: "submission", label: "Demo submission" },
  { id: "processing", label: "Demo processing" },
  { id: "result", label: "Demo result" },
  { id: "completed", label: "Demo completed" },
] as const;

export function demoSteps(completedCount: number): TimelineStep[] {
  return DEMO_STEP_DEFS.map((step, index) => ({
    id: step.id,
    label: step.label,
    detail: "Simulation only",
    state: index < completedCount ? "done" : index === completedCount ? "active" : "pending",
  }));
}

export function completedDemoSteps(): TimelineStep[] {
  return DEMO_STEP_DEFS.map((step) => ({
    id: step.id,
    label: step.label,
    detail: "Simulation only",
    state: "done" as const,
  }));
}

export function demoPhase(completedCount: number): TxPhase {
  if (completedCount <= 0) return "preview";
  if (completedCount === 1) return "preview";
  if (completedCount === 2) return "submitted";
  if (completedCount === 3) return "processing";
  if (completedCount === 4) return "demo-result";
  return "completed";
}

export interface LiveTimelineInput {
  approval: "active" | "done" | "failed";
  submitted: "pending" | "done" | "failed";
  hash: string | null;
  confirmation: "pending" | "active" | "done" | "failed";
  genLayerDetail: string | null;
}

const UNAVAILABLE_DETAIL = "Detailed GenLayer status is unavailable from the current integration.";

export function liveSteps(input: LiveTimelineInput): TimelineStep[] {
  const hash = isTransactionHash(input.hash) ? input.hash : null;
  const steps: TimelineStep[] = [
    {
      id: "approval",
      label: "Wallet approval required",
      detail:
        input.approval === "failed"
          ? "Your wallet rejected the transaction."
          : "Please confirm the transaction in your wallet.",
      state: input.approval === "done" ? "done" : input.approval === "failed" ? "failed" : "active",
    },
    {
      id: "submitted",
      label: "Transaction submitted",
      detail: input.submitted === "pending" ? "Waiting for the wallet to return a hash." : "The transaction was submitted.",
      state: input.submitted === "pending" ? "pending" : input.submitted === "failed" ? "failed" : "done",
    },
    {
      id: "hash",
      label: "Transaction hash received",
      detail: hash ? hash : "No transaction hash has been returned. Rising will not invent one.",
      state: hash ? "done" : input.submitted === "failed" ? "failed" : "pending",
    },
    {
      id: "confirmation",
      label: "Waiting for confirmation",
      detail:
        input.confirmation === "done"
          ? "A real receipt was received."
          : input.confirmation === "failed"
            ? "The transaction was not confirmed."
            : "Rising will not show success before confirmation.",
      state: input.confirmation,
    },
  ];

  steps.push({
    id: "genlayer-detail",
    label: "GenLayer evaluation status",
    detail: input.genLayerDetail ?? UNAVAILABLE_DETAIL,
    state: input.genLayerDetail ? "done" : "unavailable",
  });
  return steps;
}

export function livePhase(input: LiveTimelineInput): TxPhase {
  if (input.approval === "failed" || input.submitted === "failed" || input.confirmation === "failed") {
    return "failed";
  }
  if (input.confirmation === "done") return "confirmed";
  if (input.submitted === "done") return "waiting";
  return "wallet-approval";
}
