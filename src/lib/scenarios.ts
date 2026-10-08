import { assessEvidence } from "@/lib/evidence";
import { BASIN_NAME } from "@/lib/policy";
import type { EvidenceSource, Scenario } from "@/lib/types";

export const EVIDENCE_ORIGIN = "https://rising-kira-68d0.vercel.app/evidence";

const RETRIEVED_AT = "2026-10-07T11:30:00.000Z";
const FRESH_AT = "2026-10-07T11:00:00.000Z";
const STALE_AT = "2026-09-01T11:00:00.000Z";

function source(partial: EvidenceSource): EvidenceSource {
  return partial;
}

function reservoir(
  id: string,
  fileName: string,
  role: "primary" | "secondary",
  percent: number | null,
  observedAt: string | null,
  status: EvidenceSource["status"],
  freshness: EvidenceSource["freshness"],
): EvidenceSource {
  return source({
    id,
    name: role === "primary" ? `${BASIN_NAME} reservoir gauge` : `${BASIN_NAME} reservoir mirror`,
    url: `${EVIDENCE_ORIGIN}/${fileName}`,
    valueLabel: percent === null ? "No reading" : `${percent}%`,
    valueNumber: percent,
    unit: "percent full",
    observedAt,
    retrievedAt: RETRIEVED_AT,
    freshness,
    role,
    status,
    kind: "reservoir",
  });
}

function river(id: string, fileName: string, label: string): EvidenceSource {
  return source({
    id,
    name: `${BASIN_NAME} river gauge`,
    url: `${EVIDENCE_ORIGIN}/${fileName}`,
    valueLabel: label,
    valueNumber: null,
    unit: "status",
    observedAt: FRESH_AT,
    retrievedAt: RETRIEVED_AT,
    freshness: "fresh",
    role: "secondary",
    status: "available",
    kind: "river-flow",
  });
}

function consistent(
  id: string,
  title: string,
  summary: string,
  percent: number,
  riverFlowStatus: string,
): Scenario {
  const pages: Record<string, [string, string, string]> = {
    normal: ["r80-a.txt", "r80-b.txt", "flow-a.txt"],
    moderate: ["r58-a.txt", "r58-b.txt", "flow-b.txt"],
    severe: ["r30-a.txt", "r30-b.txt", "flow-c.txt"],
    emergency: ["r15-a.txt", "r15-b.txt", "flow-d.txt"],
  };
  const file = pages[id];
  if (!file) {
    throw new Error(`Scenario ${id} has no evidence pages.`);
  }
  const sources = [
    reservoir(`${id}-primary`, file[0], "primary", percent, FRESH_AT, "available", "fresh"),
    reservoir(`${id}-secondary`, file[1], "secondary", percent, FRESH_AT, "available", "fresh"),
    river(`${id}-river`, file[2], riverFlowStatus),
  ];
  const assessment = assessEvidence(sources);
  if (assessment.status !== "consistent" || assessment.reservoirPercent !== percent) {
    throw new Error(`Scenario ${id} does not assess as consistent.`);
  }
  return {
    id,
    title,
    summary,
    reservoirPercent: percent,
    riverFlowStatus,
    evidenceStatus: "consistent",
    sources,
  };
}

export const SCENARIOS: readonly Scenario[] = [
  consistent(
    "normal",
    "Scenario 1 — Normal",
    "Reservoir 80%, river flow normal.",
    80,
    "Normal",
  ),
  consistent(
    "moderate",
    "Scenario 2 — Moderate",
    "Reservoir 58%, river flow below normal.",
    58,
    "Below normal",
  ),
  consistent(
    "severe",
    "Scenario 3 — Severe",
    "Reservoir 30%, river flow below normal.",
    30,
    "Below normal",
  ),
  consistent(
    "emergency",
    "Scenario 4 — Emergency",
    "Reservoir 15%, river flow critically low.",
    15,
    "Critically low",
  ),
  {
    id: "conflict",
    title: "Scenario 5 — Conflicting sources",
    summary: "The two fictional reservoir sources disagree. Allocation must stay unchanged.",
    reservoirPercent: null,
    riverFlowStatus: "Below normal",
    evidenceStatus: "conflict",
    sources: [
      reservoir("conflict-primary", "r58-c.txt", "primary", 58, FRESH_AT, "available", "fresh"),
      reservoir("conflict-secondary", "r30-c.txt", "secondary", 31, FRESH_AT, "available", "fresh"),
      river("conflict-river", "flow-e.txt", "Below normal"),
    ],
  },
  {
    id: "insufficient",
    title: "Scenario 6 — Insufficient evidence",
    summary: "One source is missing and the other is stale. Allocation must stay unchanged.",
    reservoirPercent: null,
    riverFlowStatus: "Unavailable",
    evidenceStatus: "insufficient",
    sources: [
      reservoir("insufficient-primary", "missing-a.txt", "primary", null, null, "missing", "missing"),
      reservoir("insufficient-secondary", "stale-44.txt", "secondary", 44, STALE_AT, "stale", "stale"),
      {
        id: "insufficient-river",
        name: `${BASIN_NAME} river gauge`,
        url: `${EVIDENCE_ORIGIN}/flow-f.txt`,
        valueLabel: "No reading",
        valueNumber: null,
        unit: "status",
        observedAt: null,
        retrievedAt: RETRIEVED_AT,
        freshness: "missing",
        role: "secondary",
        status: "unavailable",
        kind: "river-flow",
      },
    ],
  },
];

export const DEFAULT_SCENARIO_ID = "normal";

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}

export const DEMO_LAST_EVALUATION = "2026-10-06T15:00:00.000Z";
export const DEMO_NEXT_EVALUATION = "2026-10-08T15:00:00.000Z";
