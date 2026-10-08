import type { DroughtStage, ParticipantType } from "@/lib/types";

const STAGES: readonly DroughtStage[] = ["NORMAL", "MODERATE", "SEVERE", "EMERGENCY"];
const TYPES: readonly ParticipantType[] = ["household", "farm", "industrial"];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record && record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

export function parseStage(value: unknown): DroughtStage | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return STAGES.find((stage) => stage === normalized) ?? null;
}

export function parseParticipantType(value: unknown): ParticipantType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return TYPES.find((type) => type === normalized) ?? null;
}

export function parseWaterUnits(value: unknown): number | null {
  if (typeof value === "bigint") {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return Number(value);
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^[0-9]+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return null;
}

export interface ParsedParticipant {
  participantType: ParticipantType | null;
  participantLabel: string | null;
  baseEntitlement: number | null;
  basinId: string | null;
}

export function parseParticipant(value: unknown): ParsedParticipant | null {
  const record = asRecord(value);
  if (!record) {
    if (!Array.isArray(value)) return null;
    return {
      basinId: typeof value[0] === "string" ? value[0] : null,
      participantType: parseParticipantType(value[1]),
      participantLabel: typeof value[2] === "string" ? value[2] : null,
      baseEntitlement: parseWaterUnits(value[3]),
    };
  }
  const parsed: ParsedParticipant = {
    basinId: typeof pick(record, ["basin_id", "basinId", "basin"]) === "string"
      ? String(pick(record, ["basin_id", "basinId", "basin"]))
      : null,
    participantType: parseParticipantType(pick(record, ["participant_type", "participantType", "type"])),
    participantLabel:
      typeof pick(record, ["participant_label", "participantLabel", "label"]) === "string"
        ? String(pick(record, ["participant_label", "participantLabel", "label"]))
        : null,
    baseEntitlement: parseWaterUnits(pick(record, ["base_entitlement", "baseEntitlement", "entitlement"])),
  };
  if (!parsed.participantType && !parsed.participantLabel && parsed.baseEntitlement === null && !parsed.basinId) {
    return null;
  }
  return parsed;
}

export interface ParsedEvaluation {
  id: string | null;
  stage: DroughtStage | null;
  reservoirPercent: number | null;
  statusLabel: string | null;
  allocation: number | null;
}

export function parseEvaluation(value: unknown): ParsedEvaluation | null {
  if (typeof value === "string") {
    const stage = parseStage(value);
    return stage ? { id: null, stage, reservoirPercent: null, statusLabel: null, allocation: null } : null;
  }
  const allocationOnly = parseWaterUnits(value);
  if (typeof value === "number" || typeof value === "bigint" || (typeof value === "string" && allocationOnly !== null)) {
    return {
      id: null,
      stage: null,
      reservoirPercent: null,
      statusLabel: null,
      allocation: allocationOnly,
    };
  }
  const record = asRecord(value);
  if (!record) return null;
  const reservoirRaw = pick(record, ["reservoir_percent", "reservoirPercent", "reservoir"]);
  const reservoir =
    typeof reservoirRaw === "number" && Number.isFinite(reservoirRaw) ? reservoirRaw : null;
  const parsed: ParsedEvaluation = {
    id: typeof pick(record, ["evaluation_id", "evaluationId", "id"]) === "string"
      ? String(pick(record, ["evaluation_id", "evaluationId", "id"]))
      : null,
    stage: parseStage(pick(record, ["drought_stage", "droughtStage", "stage"])),
    reservoirPercent: reservoir,
    statusLabel:
      typeof pick(record, ["status", "evaluation_status", "evaluationStatus"]) === "string"
        ? String(pick(record, ["status", "evaluation_status", "evaluationStatus"]))
        : null,
    allocation: parseWaterUnits(pick(record, ["allocation", "current_allocation", "currentAllocation", "water_units"])),
  };
  if (!parsed.id && !parsed.stage && parsed.reservoirPercent === null && !parsed.statusLabel && parsed.allocation === null) {
    return null;
  }
  return parsed;
}
