import { calculateAllocation, multiplierBps, POLICY_VERSION } from "@/lib/policy";
import type {
  DroughtStage,
  EvidenceAssessmentStatus,
  ParticipantType,
  RecordSource,
  StoredAllocation,
} from "@/lib/types";

export interface AllocationDecisionInput {
  previous: StoredAllocation | null;
  canUpdate: boolean;
  stage: DroughtStage | null;
  evidenceStatus: EvidenceAssessmentStatus;
  baseEntitlement: number;
  participantType: ParticipantType;
  evaluationId: string;
  appliedAt: string;
  source: RecordSource;
  blockedMessage: string;
}

export interface AllocationDecision {
  allocation: StoredAllocation | null;
  applied: boolean;
  message: string;
  currentAllocation: number | null;
  previousAllocation: number | null;
  multiplierBps: number | null;
}

export function decideAllocation(input: AllocationDecisionInput): AllocationDecision {
  const previousUnits = input.previous?.waterUnits ?? null;
  if (!input.canUpdate || !input.stage) {
    return {
      allocation: input.previous,
      applied: false,
      message: input.blockedMessage,
      currentAllocation: previousUnits,
      previousAllocation: previousUnits,
      multiplierBps: input.previous?.multiplierBps ?? null,
    };
  }

  const waterUnits = calculateAllocation(input.baseEntitlement, input.stage, input.participantType);
  const bps = multiplierBps(input.stage, input.participantType);
  const allocation: StoredAllocation = {
    stage: input.stage,
    multiplierBps: bps,
    baseEntitlement: input.baseEntitlement,
    waterUnits,
    previousWaterUnits: previousUnits,
    policyVersion: POLICY_VERSION,
    evaluationId: input.evaluationId,
    appliedAt: input.appliedAt,
    source: input.source,
  };
  return {
    allocation,
    applied: true,
    message:
      input.source === "demo"
        ? "Demo result applied in this browser. No blockchain transaction was submitted."
        : "Allocation calculated from the contract drought stage and Rising Policy v1.",
    currentAllocation: waterUnits,
    previousAllocation: previousUnits,
    multiplierBps: bps,
  };
}
