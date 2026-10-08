export interface GenLayerObservation {
  statusName: string | null;
  resultName: string | null;
  executionResultName: string | null;
  phase: "waiting" | "confirmed" | "failed";
  finalityStatus: string;
  validatorStatus: string;
  evaluationResult: string;
  appealDeadline: string | null;
  detail: string | null;
}

const UNAVAILABLE = "Detailed GenLayer status is unavailable from the current integration.";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function observeGenLayerTransaction(tx: unknown): GenLayerObservation | null {
  if (!tx || typeof tx !== "object") return null;
  const record = tx as Record<string, unknown>;
  const statusName = text(record.statusName);
  const resultName = text(record.resultName);
  const executionResultName = text(record.txExecutionResultName);
  if (!statusName && !resultName && !executionResultName) return null;

  const deadline = text(record.appealDeadline) ?? text(record.appeal_deadline);
  let phase: GenLayerObservation["phase"] = "waiting";
  let finalityStatus = "Not finalized";
  let validatorStatus = UNAVAILABLE;
  let evaluationResult = "The evaluation result is not available yet.";

  switch (statusName) {
    case "PENDING":
      validatorStatus = "Transaction submitted";
      evaluationResult = "Waiting for the Intelligent Contract.";
      break;
    case "PROPOSING":
      validatorStatus = "Leader evaluating";
      evaluationResult = "A leader proposal is in progress. This is not a final result.";
      break;
    case "COMMITTING":
    case "REVEALING":
      validatorStatus = "Validators evaluating";
      evaluationResult = "Validator votes are in progress. This is not a final result.";
      break;
    case "APPEAL_COMMITTING":
    case "APPEAL_REVEALING":
      validatorStatus = "Appeal window open";
      evaluationResult = "An appeal is in progress. The allocation must not change until review is complete.";
      break;
    case "READY_TO_FINALIZE":
      validatorStatus = "Appeal window open";
      evaluationResult = "The transaction is ready to finalize. Rising has not marked it finalized.";
      break;
    case "ACCEPTED":
      validatorStatus = resultName === "MAJORITY_AGREE" || resultName === "SUCCESS" ? "Consensus reached" : "Accepted";
      finalityStatus = "Not finalized";
      evaluationResult = "The transaction was accepted. Finality is still open.";
      break;
    case "FINALIZED":
      finalityStatus = "Finalized";
      validatorStatus = "Finalized";
      if (executionResultName === "FINISHED_WITH_ERROR" || resultName === "FAILURE" || resultName === "MAJORITY_DISAGREE") {
        phase = "failed";
        evaluationResult = "The transaction finalized with a failed execution. State was not treated as successful.";
      } else if (
        executionResultName === "FINISHED_WITH_RETURN" ||
        resultName === "SUCCESS" ||
        resultName === "MAJORITY_AGREE"
      ) {
        phase = "confirmed";
        evaluationResult = "The transaction is finalized.";
      } else {
        phase = "waiting";
        evaluationResult =
          "A finalized status was reported, but the execution result is not available yet. Rising has not marked the allocation updated.";
      }
      break;
    case "CANCELED":
    case "LEADER_TIMEOUT":
    case "VALIDATORS_TIMEOUT":
      phase = "failed";
      finalityStatus = statusName === "CANCELED" ? "Canceled" : "Not finalized";
      validatorStatus = statusName === "LEADER_TIMEOUT" ? "Leader timeout" : statusName === "VALIDATORS_TIMEOUT" ? "Validator timeout" : "Canceled";
      evaluationResult = "The transaction did not succeed.";
      break;
    case "UNDETERMINED":
      phase = "failed";
      validatorStatus = "Inconclusive";
      finalityStatus = "Not finalized";
      evaluationResult = "The evaluation was inconclusive. The previous allocation remains active.";
      break;
    default:
      if (!statusName) {
        validatorStatus = UNAVAILABLE;
        finalityStatus = UNAVAILABLE;
      }
      break;
  }

  if (resultName === "NO_MAJORITY") {
    phase = "failed";
    validatorStatus = "Inconclusive";
    evaluationResult = "The evaluation was inconclusive. The previous allocation remains active.";
  }
  if (resultName === "DISAGREE" || resultName === "MAJORITY_DISAGREE") {
    validatorStatus = "Disputed";
    if (phase === "confirmed") phase = "failed";
    evaluationResult = "The evaluation is disputed. Existing allocations remain active until review is complete.";
  }

  const detailParts = [statusName, resultName, executionResultName].filter(Boolean);
  return {
    statusName,
    resultName,
    executionResultName,
    phase,
    finalityStatus,
    validatorStatus,
    evaluationResult,
    appealDeadline: deadline,
    detail: detailParts.length > 0 ? detailParts.join(" · ") : null,
  };
}

export function unavailableObservation(): GenLayerObservation {
  return {
    statusName: null,
    resultName: null,
    executionResultName: null,
    phase: "waiting",
    finalityStatus: UNAVAILABLE,
    validatorStatus: UNAVAILABLE,
    evaluationResult: "The evaluation result is not available yet.",
    appealDeadline: null,
    detail: null,
  };
}
