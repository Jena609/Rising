import { DEFAULT_SCENARIO_ID } from "@/lib/scenarios";
import type { SessionState } from "@/lib/types";

export const STORAGE_KEY = "rising.session.v3";

export function emptySession(): SessionState {
  return {
    participant: null,
    allocation: null,
    allocationHistory: [],
    evaluations: [],
    challenges: [],
    transactions: [],
    scenarioId: DEFAULT_SCENARIO_ID,
  };
}

export function loadSession(): SessionState {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      ...emptySession(),
      ...parsed,
      allocationHistory: Array.isArray(parsed.allocationHistory) ? parsed.allocationHistory : [],
      evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      scenarioId: typeof parsed.scenarioId === "string" ? parsed.scenarioId : DEFAULT_SCENARIO_ID,
    };
  } catch {
    return emptySession();
  }
}

export function saveSession(state: SessionState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
