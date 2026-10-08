import { stageFromReservoir } from "@/lib/policy";
import type {
  DroughtStage,
  EvidenceAssessmentStatus,
  EvidenceFreshness,
  EvidenceSource,
} from "@/lib/types";

/** A demo-policy freshness window. This is not a legal or agency standard. */
export const FRESHNESS_WINDOW_MS = 48 * 60 * 60 * 1000;

export const CONFLICT_MESSAGE =
  "Evidence sources conflict. Existing allocations remain active until review is complete.";

export const INSUFFICIENT_MESSAGE =
  "Insufficient current evidence. The previous allocation remains active.";

export interface EvidenceAssessment {
  status: EvidenceAssessmentStatus;
  reservoirPercent: number | null;
  stage: DroughtStage | null;
  canUpdateAllocation: boolean;
  message: string;
}

export function freshnessFromTimestamp(
  observedAt: string | null,
  retrievedAt: string,
  nowMs: number,
): EvidenceFreshness {
  const stamp = observedAt ?? retrievedAt;
  const time = Date.parse(stamp);
  if (!Number.isFinite(time)) return "missing";
  if (nowMs - time > FRESHNESS_WINDOW_MS) return "stale";
  return "fresh";
}

export function assessEvidence(sources: EvidenceSource[]): EvidenceAssessment {
  const reservoirSources = sources.filter((source) => source.kind === "reservoir");
  const usable = reservoirSources.filter(
    (source) =>
      source.status === "available" &&
      source.freshness === "fresh" &&
      source.valueNumber !== null &&
      Number.isFinite(source.valueNumber),
  );

  if (usable.length === 0) {
    return {
      status: "insufficient",
      reservoirPercent: null,
      stage: null,
      canUpdateAllocation: false,
      message: INSUFFICIENT_MESSAGE,
    };
  }

  const distinct = [...new Set(usable.map((source) => source.valueNumber as number))];
  if (distinct.length > 1) {
    return {
      status: "conflict",
      reservoirPercent: null,
      stage: null,
      canUpdateAllocation: false,
      message: CONFLICT_MESSAGE,
    };
  }

  const reservoirPercent = distinct[0];
  return {
    status: "consistent",
    reservoirPercent,
    stage: stageFromReservoir(reservoirPercent),
    canUpdateAllocation: true,
    message: "The fictional reservoir sources agree. The drought stage follows Rising Policy v1.",
  };
}
