import type { DroughtStage, ParticipantType } from "@/lib/types";

export const POLICY_VERSION = "Rising Policy v1";
export const BASIN_ID = "green-valley";
export const BASIN_NAME = "Green Valley Basin";
export const BASIN_WARNING =
  "Green Valley Basin is a fictional testnet basin used for demonstration.";
export const DEMO_DATA_LABEL = "Demo data — not a live water-management decision.";
export const DEMO_BANNER =
  "Demo Mode — Studio Next contract integration is not configured, so blockchain transactions are disabled.";
export const MAX_BASE_ENTITLEMENT = 1_000_000_000;

export interface StageRule {
  stage: DroughtStage;
  label: string;
  reservoirRule: string;
  householdBps: number;
  farmBps: number;
  industrialBps: number;
}

export const STAGE_RULES: readonly StageRule[] = [
  {
    stage: "NORMAL",
    label: "Normal",
    reservoirRule: "Reservoir above 70%",
    householdBps: 10000,
    farmBps: 10000,
    industrialBps: 10000,
  },
  {
    stage: "MODERATE",
    label: "Moderate",
    reservoirRule: "Reservoir from 40% through 70%",
    householdBps: 10000,
    farmBps: 8000,
    industrialBps: 6000,
  },
  {
    stage: "SEVERE",
    label: "Severe",
    reservoirRule: "Reservoir from 20% through below 40%",
    householdBps: 10000,
    farmBps: 5000,
    industrialBps: 2500,
  },
  {
    stage: "EMERGENCY",
    label: "Emergency",
    reservoirRule: "Reservoir below 20%",
    householdBps: 10000,
    farmBps: 2500,
    industrialBps: 1000,
  },
] as const;

const RULE_BY_STAGE = Object.fromEntries(STAGE_RULES.map((rule) => [rule.stage, rule])) as Record<
  DroughtStage,
  StageRule
>;

export function stageRule(stage: DroughtStage): StageRule {
  return RULE_BY_STAGE[stage];
}

export function stageLabel(stage: DroughtStage): string {
  return RULE_BY_STAGE[stage].label;
}

/**
 * Rising Policy v1.
 * Above 70% is Normal. 40% through 70% is Moderate.
 * 20% through below 40% is Severe. Below 20% is Emergency.
 */
export function stageFromReservoir(percent: number): DroughtStage {
  if (!Number.isFinite(percent)) {
    throw new Error("Reservoir percentage must be a finite number.");
  }
  if (percent > 70) return "NORMAL";
  if (percent >= 40) return "MODERATE";
  if (percent >= 20) return "SEVERE";
  return "EMERGENCY";
}

export function multiplierBps(stage: DroughtStage, participantType: ParticipantType): number {
  const rule = RULE_BY_STAGE[stage];
  if (participantType === "household") return rule.householdBps;
  if (participantType === "farm") return rule.farmBps;
  return rule.industrialBps;
}

export function formatMultiplier(bps: number): string {
  const percent = bps / 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(2)}%`;
}

/**
 * current allocation = base entitlement × participant multiplier.
 * The product is rounded to the nearest whole water unit.
 * Exact policy products used by Rising Policy v1 stay exact.
 */
export function calculateAllocation(
  baseEntitlement: number,
  stage: DroughtStage,
  participantType: ParticipantType,
): number {
  if (!Number.isInteger(baseEntitlement) || baseEntitlement <= 0) {
    throw new Error("Base entitlement must be a positive whole number of water units.");
  }
  if (baseEntitlement > MAX_BASE_ENTITLEMENT) {
    throw new Error("Base entitlement is above the supported range.");
  }
  const bps = multiplierBps(stage, participantType);
  const product = baseEntitlement * bps;
  if (!Number.isSafeInteger(product)) {
    throw new Error("Allocation is outside the supported numeric range.");
  }
  return Math.round(product / 10000);
}

export function participantTypeLabel(participantType: ParticipantType): string {
  if (participantType === "household") return "Household";
  if (participantType === "farm") return "Farm";
  return "Industrial";
}
