import { calculateAllocation, multiplierBps, POLICY_VERSION } from "@/lib/policy";
import { parseEvaluation, parseWaterUnits } from "@/lib/parse-contract";
import type {
  DroughtStage,
  EvaluationRecord,
  EvidenceAssessmentStatus,
  ParticipantType,
  StoredAllocation,
} from "@/lib/types";

export type ConfirmedRead = (
  method: "get_latest_evaluation_id" | "get_evaluation",
  args: unknown[],
) => Promise<unknown>;

export function parseLatestEvaluationId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ["evaluation_id", "evaluationId", "id", "result"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim();
  }
  return null;
}

/**
 * After a write is finalized, identify the evaluation that write created.
 * The current allocation is not an input: a disputed write leaves that value unchanged.
 */
export async function readConfirmedEvaluation(
  walletAddress: string,
  methods: readonly string[] | null,
  read: ConfirmedRead,
): Promise<{ id: string | null; evaluation: unknown }> {
  if (!methods?.includes("get_latest_evaluation_id") || !methods.includes("get_evaluation")) {
    return { id: null, evaluation: null };
  }
  const id = parseLatestEvaluationId(await read("get_latest_evaluation_id", [walletAddress]));
  if (!id) return { id: null, evaluation: null };
  return { id, evaluation: await read("get_evaluation", [id]) };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isAppliedFlag(value: unknown): boolean {
  return value === true || value === "true";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function allocationFromCurrentRecord(
  raw: unknown,
  baseEntitlement: number,
  participantType: ParticipantType,
): StoredAllocation | null {
  const parsed = parseEvaluation(raw);
  if (!parsed?.stage || parsed.allocation === null) return null;
  return {
    stage: parsed.stage,
    multiplierBps: multiplierBps(parsed.stage, participantType),
    baseEntitlement,
    waterUnits: parsed.allocation,
    previousWaterUnits: null,
    policyVersion: POLICY_VERSION,
    evaluationId: parsed.id ?? "contract-allocation",
    appliedAt: "",
    source: "contract",
  };
}

export interface ResolveLiveEvaluationInput {
  evaluation: unknown;
  previous: StoredAllocation | null;
  baseEntitlement: number;
  participantType: ParticipantType;
  appliedAt: string;
  transactionId: string;
  transactionHash?: string;
  submittedUrls: string[];
  finalityStatus: string;
  validatorStatus: string;
  appealDeadline: string | null;
  phase: "confirmed" | "failed" | "waiting";
}

export interface LiveEvaluationOutcome {
  evaluation: EvaluationRecord;
  allocation: StoredAllocation | null;
  allocationChanged: boolean;
}

export function allocationOutcomeCopy(
  evaluation: Pick<EvaluationRecord, "allocationApplied" | "statusLabel">,
): string {
  if (evaluation.allocationApplied && evaluation.statusLabel === "Finalized") {
    return "Allocation applied from this evaluation.";
  }
  return "The previous allocation remains active.";
}

export function evidenceReadingLines(readings: unknown[] | undefined): string[] {
  if (!readings) return [];
  return readings.map((item) => {
    if (!item || typeof item !== "object") return "Unreadable reading";
    const record = item as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url : "page";
    const status = typeof record.status === "string" ? record.status : "unknown";
    const percent = typeof record.reservoir_percent === "number" ? `${record.reservoir_percent}%` : "no percent";
    return `${url}: ${status}, ${percent}`;
  });
}

export function resolveLiveEvaluation(input: ResolveLiveEvaluationInput): LiveEvaluationOutcome {
  const record = asRecord(input.evaluation);
  const parsed = record && Object.keys(record).length > 0 ? parseEvaluation(record) : null;
  const status = typeof record?.status === "string" ? record.status : "";
  const appliedFlag = isAppliedFlag(record?.applied);
  const stage = parsed?.stage ?? null;
  const contractUnits = parsed?.allocation ?? null;
  const canApply =
    input.phase === "confirmed" && status === "Finalized" && appliedFlag && stage !== null && contractUnits !== null;
  const evidenceStatus: EvidenceAssessmentStatus =
    status === "Disputed" ? "conflict" : status === "Finalized" && canApply ? "consistent" : "insufficient";
  const statusLabel = canApply
    ? "Finalized"
    : status === "Disputed"
      ? "Disputed"
      : status === "Inconclusive"
        ? "Inconclusive"
        : input.phase === "failed"
          ? "Failed"
          : input.phase === "confirmed"
            ? "Unverified"
            : "Waiting";

  let message =
    typeof record?.message === "string" && record.message.trim().length > 0
      ? record.message
      : input.phase === "confirmed"
        ? "The transaction is confirmed, but the evaluation record could not be read. The previous allocation remains active."
        : input.phase === "failed"
          ? "The transaction failed. The previous allocation remains active."
          : "The transaction is still processing. The previous allocation remains active.";
  if (canApply && stage && contractUnits !== null) {
    const local = calculateAllocation(input.baseEntitlement, stage, input.participantType);
    if (local !== contractUnits) {
      message = `${message} The contract allocation is ${contractUnits} water units. The local policy check is ${local}. Rising is showing the contract amount.`;
    }
  }

  const previousUnits = parseWaterUnits(record?.previous_allocation) ?? input.previous?.waterUnits ?? null;
  const recordUrls = stringList(record?.evidence_urls);
  const evaluationId = parsed?.id ?? input.transactionId;
  const evaluation: EvaluationRecord = {
    id: evaluationId,
    mode: "live",
    basinId: typeof record?.basin_id === "string" ? record.basin_id : "green-valley",
    statusLabel,
    evidenceStatus,
    droughtStage: canApply ? stage : null,
    reservoirPercent: canApply ? (parsed?.reservoirPercent ?? null) : null,
    riverFlowStatus: "Not available",
    sources: [],
    submittedUrls: recordUrls.length > 0 ? recordUrls : input.submittedUrls,
    policyVersion: typeof record?.policy_version === "string" ? record.policy_version : POLICY_VERSION,
    message,
    allocationApplied: canApply,
    currentAllocation: canApply ? contractUnits : (input.previous?.waterUnits ?? previousUnits),
    previousAllocation: previousUnits,
    multiplierBps: canApply && stage ? multiplierBps(stage, input.participantType) : (input.previous?.multiplierBps ?? null),
    transactionId: input.transactionId,
    transactionHash: input.transactionHash,
    contractEvaluationId: parsed?.id ?? null,
    appealDeadline: input.appealDeadline,
    validatorStatus: input.validatorStatus,
    finalityStatus: input.finalityStatus,
    createdAt: input.appliedAt,
    contractStage: canApply ? stage : null,
    contractAllocation: canApply ? contractUnits : null,
    evidenceReadings: Array.isArray(record?.evidence_readings) ? record.evidence_readings : [],
  };

  if (!canApply || !stage || contractUnits === null) {
    return { evaluation, allocation: input.previous, allocationChanged: false };
  }

  const allocation: StoredAllocation = {
    stage: stage as DroughtStage,
    multiplierBps: multiplierBps(stage, input.participantType),
    baseEntitlement: input.baseEntitlement,
    waterUnits: contractUnits,
    previousWaterUnits: previousUnits,
    policyVersion: POLICY_VERSION,
    evaluationId: parsed?.id ?? evaluationId,
    appliedAt: input.appliedAt,
    source: "contract",
  };
  return { evaluation, allocation, allocationChanged: true };
}
