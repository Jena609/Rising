import { MAX_BASE_ENTITLEMENT } from "@/lib/policy";
import type { ParticipantType } from "@/lib/types";
import { safeHttpUrl } from "@/lib/urls";

const LABEL_RE = /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,39}$/;
const TYPES: readonly ParticipantType[] = ["household", "farm", "industrial"];

export interface RegistrationInput {
  participantType: ParticipantType | "";
  participantLabel: string;
  baseEntitlement: string;
  acknowledged: boolean;
}

export interface RegistrationValue {
  participantType: ParticipantType;
  participantLabel: string;
  baseEntitlement: number;
}

export interface ChallengeInput {
  evaluationId: string;
  alternativeEvidenceUrl: string;
  secondEvidenceUrl: string;
  reason: string;
  acknowledged: boolean;
}

export interface ChallengeValue {
  evaluationId: string;
  alternativeEvidenceUrl: string;
  secondEvidenceUrl: string | null;
  reason: string;
}

export function validateRegistration(
  input: RegistrationInput,
): { ok: true; value: RegistrationValue } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!TYPES.includes(input.participantType as ParticipantType)) {
    errors.participantType = "Select a participant type.";
  }
  const label = input.participantLabel.trim();
  if (!LABEL_RE.test(label)) {
    errors.participantLabel =
      "Enter a label of 2–40 characters, such as Farm 004. Do not enter a legal name.";
  }
  const rawAmount = input.baseEntitlement.trim();
  if (!/^[1-9]\d*$/.test(rawAmount)) {
    errors.baseEntitlement = "Enter a whole number of water units greater than zero.";
  } else {
    const amount = Number(rawAmount);
    if (!Number.isSafeInteger(amount) || amount > MAX_BASE_ENTITLEMENT) {
      errors.baseEntitlement = "Enter a whole number of water units up to 1,000,000,000.";
    }
  }
  if (!input.acknowledged) {
    errors.acknowledged = "Confirm that this testnet simulation does not create legal water rights.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      participantType: input.participantType as ParticipantType,
      participantLabel: label,
      baseEntitlement: Number(rawAmount),
    },
  };
}

export function validateEvidenceUrls(urls: string[]): { ok: true; urls: string[] } | { ok: false; error: string } {
  const cleaned = urls.map((url) => url.trim()).filter((url) => url.length > 0);
  if (cleaned.length === 0) {
    return { ok: false, error: "Add at least one evidence URL." };
  }
  if (cleaned.length > 6) {
    return { ok: false, error: "Submit no more than six evidence URLs." };
  }
  for (const url of cleaned) {
    if (url.length > 300 || !safeHttpUrl(url)) {
      return { ok: false, error: "Each evidence URL must be a valid https address." };
    }
  }
  return { ok: true, urls: cleaned };
}

export function validateChallenge(
  input: ChallengeInput,
  knownEvaluationIds: string[] | null,
): { ok: true; value: ChallengeValue } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const evaluationId = input.evaluationId.trim();
  if (evaluationId.length < 3 || evaluationId.length > 80) {
    errors.evaluationId = "Enter the evaluation ID you want reviewed.";
  } else if (knownEvaluationIds && !knownEvaluationIds.includes(evaluationId)) {
    errors.evaluationId = "That evaluation is not in this demo session.";
  }
  const alternative = input.alternativeEvidenceUrl.trim();
  if (!safeHttpUrl(alternative) || alternative.length > 300) {
    errors.alternativeEvidenceUrl = "Enter a valid https URL for the alternative evidence.";
  }
  const second = input.secondEvidenceUrl.trim();
  if (second && (!safeHttpUrl(second) || second.length > 300)) {
    errors.secondEvidenceUrl = "The second evidence URL must be a valid https address, or left blank.";
  }
  const reason = input.reason.trim();
  if (reason.length < 12 || reason.length > 600) {
    errors.reason = "Describe the challenge in 12–600 characters.";
  }
  if (!input.acknowledged) {
    errors.acknowledged = "Confirm that a challenge does not instantly change the allocation.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      evaluationId,
      alternativeEvidenceUrl: alternative,
      secondEvidenceUrl: second || null,
      reason,
    },
  };
}
