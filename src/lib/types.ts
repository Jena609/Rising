export type DeploymentMode = "demo" | "live";

export type DroughtStage = "NORMAL" | "MODERATE" | "SEVERE" | "EMERGENCY";

export type ParticipantType = "household" | "farm" | "industrial";

export type EvidenceFreshness = "fresh" | "stale" | "missing";

export type EvidenceRole = "primary" | "secondary";

export type SourceStatus = "available" | "unavailable" | "stale" | "invalid" | "missing";

export type EvidenceKind = "reservoir" | "river-flow";

export type EvidenceAssessmentStatus = "consistent" | "conflict" | "insufficient";

export type RecordSource = "demo" | "contract" | "submitted-unverified";

export interface EvidenceSource {
  id: string;
  name: string;
  url: string;
  valueLabel: string;
  valueNumber: number | null;
  unit: string;
  observedAt: string | null;
  retrievedAt: string;
  freshness: EvidenceFreshness;
  role: EvidenceRole;
  status: SourceStatus;
  kind: EvidenceKind;
}

export interface Scenario {
  id: string;
  title: string;
  summary: string;
  reservoirPercent: number | null;
  riverFlowStatus: string;
  evidenceStatus: EvidenceAssessmentStatus;
  sources: EvidenceSource[];
}

export interface ParticipantRecord {
  id: string;
  source: RecordSource;
  walletAddress: string | null;
  basinId: string;
  basinName: string;
  participantType: ParticipantType;
  participantLabel: string;
  baseEntitlement: number;
  registeredAt: string;
  transactionId: string;
  transactionHash?: string;
}

export interface StoredAllocation {
  stage: DroughtStage;
  multiplierBps: number;
  baseEntitlement: number;
  waterUnits: number;
  previousWaterUnits: number | null;
  policyVersion: string;
  evaluationId: string;
  appliedAt: string;
  source: RecordSource;
}

export type TxStepState = "pending" | "active" | "done" | "failed" | "unavailable";

export interface TimelineStep {
  id: string;
  label: string;
  detail: string;
  state: TxStepState;
}

export type TxPhase =
  | "preview"
  | "wallet-approval"
  | "submitted"
  | "waiting"
  | "processing"
  | "demo-result"
  | "completed"
  | "confirmed"
  | "failed";

export interface TransactionRecord {
  id: string;
  action: string;
  mode: DeploymentMode;
  phase: TxPhase;
  steps: TimelineStep[];
  hash?: string;
  confirmations?: number;
  evaluationResult?: string;
  finalityStatus: string;
  validatorStatus: string;
  errorMessage?: string;
  technicalDetail?: string;
  released?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationRecord {
  id: string;
  mode: DeploymentMode;
  basinId: string;
  statusLabel: string;
  evidenceStatus: EvidenceAssessmentStatus;
  droughtStage: DroughtStage | null;
  reservoirPercent: number | null;
  riverFlowStatus: string;
  sources: EvidenceSource[];
  submittedUrls: string[];
  policyVersion: string;
  message: string;
  allocationApplied: boolean;
  currentAllocation: number | null;
  previousAllocation: number | null;
  multiplierBps: number | null;
  transactionId: string;
  transactionHash?: string;
  contractEvaluationId: string | null;
  appealDeadline: string | null;
  validatorStatus: string;
  finalityStatus: string;
  createdAt: string;
  contractStage: DroughtStage | null;
  contractAllocation: number | null;
  evidenceReadings?: unknown[];
}

export interface ChallengeRecord {
  id: string;
  mode: DeploymentMode;
  evaluationId: string;
  alternativeEvidenceUrl: string;
  secondEvidenceUrl: string | null;
  reason: string;
  createdAt: string;
  transactionId: string;
  transactionHash?: string;
  statusLabel: string;
  message: string;
}

export interface SessionState {
  participant: ParticipantRecord | null;
  allocation: StoredAllocation | null;
  allocationHistory: StoredAllocation[];
  evaluations: EvaluationRecord[];
  challenges: ChallengeRecord[];
  transactions: TransactionRecord[];
  scenarioId: string;
}
