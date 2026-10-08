import { decideAllocation } from "@/lib/allocation";
import { assessEvidence } from "@/lib/evidence";
import { createLocalId } from "@/lib/id";
import { POLICY_VERSION } from "@/lib/policy";
import { completedDemoSteps } from "@/lib/timeline";
import type {
  ChallengeRecord,
  EvaluationRecord,
  ParticipantRecord,
  SessionState,
  TransactionRecord,
} from "@/lib/types";
import type { RegistrationValue, ChallengeValue } from "@/lib/validation";
import { getScenario } from "@/lib/scenarios";

export function upsertTransaction(state: SessionState, record: TransactionRecord): SessionState {
  const exists = state.transactions.some((item) => item.id === record.id);
  return {
    ...state,
    transactions: exists
      ? state.transactions.map((item) => (item.id === record.id ? record : item))
      : [record, ...state.transactions],
  };
}

export function demoTransaction(action: string, id = createLocalId("tx")): TransactionRecord {
  const now = new Date().toISOString();
  return {
    id,
    action,
    mode: "demo",
    phase: "completed",
    steps: completedDemoSteps(),
    finalityStatus: "Not applicable in Demo Mode",
    validatorStatus: "Validators were not asked to process this simulation.",
    evaluationResult: "Simulation only",
    createdAt: now,
    updatedAt: now,
  };
}

export function applyDemoRegistration(
  state: SessionState,
  value: RegistrationValue,
  walletAddress: string | null,
  transaction: TransactionRecord,
): SessionState {
  const participant: ParticipantRecord = {
    id: createLocalId("sim"),
    source: "demo",
    walletAddress,
    basinId: "green-valley",
    basinName: "Green Valley Basin",
    participantType: value.participantType,
    participantLabel: value.participantLabel,
    baseEntitlement: value.baseEntitlement,
    registeredAt: transaction.updatedAt,
    transactionId: transaction.id,
  };
  return { ...upsertTransaction(state, transaction), participant };
}

export function applyDemoEvaluation(
  state: SessionState,
  submittedUrls: string[],
  transaction: TransactionRecord,
): { state: SessionState; evaluation: EvaluationRecord } {
  if (!state.participant) {
    throw new Error("Register a fictional water entitlement before requesting an evaluation.");
  }
  const scenario = getScenario(state.scenarioId);
  const assessment = assessEvidence(scenario.sources);
  const evaluationId = createLocalId("eval");
  const decision = decideAllocation({
    previous: state.allocation,
    canUpdate: assessment.canUpdateAllocation,
    stage: assessment.stage,
    evidenceStatus: assessment.status,
    baseEntitlement: state.participant.baseEntitlement,
    participantType: state.participant.participantType,
    evaluationId,
    appliedAt: transaction.updatedAt,
    source: "demo",
    blockedMessage: assessment.message,
  });
  const statusLabel =
    assessment.status === "conflict"
      ? "Disputed"
      : assessment.status === "insufficient"
        ? "Inconclusive"
        : "Demo result";
  const evaluation: EvaluationRecord = {
    id: evaluationId,
    mode: "demo",
    basinId: "green-valley",
    statusLabel,
    evidenceStatus: assessment.status,
    droughtStage: assessment.canUpdateAllocation ? assessment.stage : null,
    reservoirPercent: assessment.reservoirPercent,
    riverFlowStatus: scenario.riverFlowStatus,
    sources: scenario.sources,
    submittedUrls,
    policyVersion: POLICY_VERSION,
    message: decision.message,
    allocationApplied: decision.applied,
    currentAllocation: decision.currentAllocation,
    previousAllocation: decision.previousAllocation,
    multiplierBps: decision.multiplierBps,
    transactionId: transaction.id,
    contractEvaluationId: null,
    appealDeadline: null,
    validatorStatus: "Validators were not asked to process this simulation.",
    finalityStatus: "Not applicable in Demo Mode",
    createdAt: transaction.updatedAt,
    contractStage: null,
    contractAllocation: null,
  };
  const next: SessionState = {
    ...upsertTransaction(state, {
      ...transaction,
      evaluationResult: "Simulation only",
    }),
    evaluations: [evaluation, ...state.evaluations],
    allocation: decision.allocation,
    allocationHistory:
      decision.applied && decision.allocation
        ? [decision.allocation, ...state.allocationHistory]
        : state.allocationHistory,
  };
  return { state: next, evaluation };
}

export function applyChallenge(
  state: SessionState,
  value: ChallengeValue,
  transaction: TransactionRecord,
  mode: "demo" | "live",
): SessionState {
  const challenge: ChallengeRecord = {
    id: createLocalId("chg"),
    mode,
    evaluationId: value.evaluationId,
    alternativeEvidenceUrl: value.alternativeEvidenceUrl,
    secondEvidenceUrl: value.secondEvidenceUrl,
    reason: value.reason,
    createdAt: transaction.updatedAt,
    transactionId: transaction.id,
    transactionHash: transaction.hash,
    statusLabel: mode === "demo" ? "Demo Challenge" : transaction.phase === "confirmed" ? "Submitted" : "Pending",
    message:
      mode === "demo"
        ? "Demo Challenge. This challenge is stored in this browser. It was not recorded on-chain, and the allocation was not changed."
        : "Your challenge was submitted. It does not instantly change the current allocation.",
  };
  return {
    ...upsertTransaction(state, transaction),
    challenges: [challenge, ...state.challenges],
    allocation: state.allocation,
    allocationHistory: state.allocationHistory,
  };
}
