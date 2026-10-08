"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { decideAllocation } from "@/lib/allocation";
import { calculateAllocation } from "@/lib/policy";
import { methodAvailable, risingConfig, type ExpectedMethod } from "@/lib/config";
import { toReadableError } from "@/lib/errors";
import {
  loadContractMethods,
  readContractMethod,
  readGenLayerObservation,
  readViemConfirmation,
  writeContractMethod,
} from "@/lib/genlayer-client";
import type { GenLayerObservation } from "@/lib/genlayer-status";
import { createLocalId } from "@/lib/id";
import { parseEvaluation, parseParticipant } from "@/lib/parse-contract";
import { liveSubmitBlockReason } from "@/lib/studio-next";
import { BASIN_ID, BASIN_NAME, multiplierBps, POLICY_VERSION } from "@/lib/policy";
import {
  applyChallenge,
  applyDemoEvaluation,
  applyDemoRegistration,
  upsertTransaction,
} from "@/lib/session";

import { clearSession, emptySession, loadSession, saveSession } from "@/lib/storage";
import { demoPhase, demoSteps, livePhase, liveSteps } from "@/lib/timeline";
import type { EvaluationRecord, EvidenceAssessmentStatus, ParticipantRecord, SessionState, StoredAllocation, TransactionRecord } from "@/lib/types";
import type { ChallengeValue, RegistrationValue } from "@/lib/validation";
import { useWallet } from "@/components/WalletProvider";

interface ToastItem {
  id: string;
  tone: "info" | "success" | "error";
  message: string;
}

interface RisingContextValue {
  ready: boolean;
  session: SessionState;
  busy: boolean;
  schemaMethods: string[] | null;
  toasts: ToastItem[];
  pushToast: (tone: ToastItem["tone"], message: string) => void;
  dismissToast: (id: string) => void;
  setScenario: (id: string) => void;
  registerParticipant: (value: RegistrationValue) => Promise<void>;
  requestEvaluation: (urls: string[]) => Promise<void>;
  submitChallenge: (value: ChallengeValue) => Promise<void>;
  checkTransaction: (id: string) => Promise<void>;
  clearLocalSession: () => void;
  releaseLocalWait: (id: string) => void;
  actionError: string | null;
  dismissActionError: () => void;
}

const RisingContext = createContext<RisingContextValue | null>(null);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pending(transactions: TransactionRecord[], action: string): boolean {
  return transactions.some(
    (item) =>
      !item.released &&
      item.action === action &&
      ["preview", "wallet-approval", "submitted", "waiting", "processing", "demo-result"].includes(item.phase),
  );
}

export function RisingProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const [session, setSession] = useState<SessionState>(emptySession);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [schemaMethods, setSchemaMethods] = useState<string[] | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const previousAddress = useRef<Address | null>(null);

  const pushToast = useCallback((tone: ToastItem["tone"], message: string) => {
    const id = createLocalId("sim");
    setToasts((current) => {
      if (current.some((item) => item.tone === tone && item.message === message)) return current;
      return [{ id, tone, message }, ...current].slice(0, 4);
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissActionError = useCallback(() => setActionError(null), []);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSession(session);
  }, [hydrated, session]);

  useEffect(() => {
    if (!risingConfig.liveReady) return;
    let active = true;
    loadContractMethods()
      .then((methods) => {
        if (active) setSchemaMethods(methods);
      })
      .catch(() => {
        if (active) setSchemaMethods(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !risingConfig.liveReady || !wallet.address || !wallet.correctNetwork || busy) return;
    const walletAddress = wallet.address;
    let active = true;
    void (async () => {
      try {
        const methods = await loadContractMethods();
        if (!active) return;
        setSchemaMethods(methods);
        if (!methodAvailable("get_participant", methods)) return;
        const participantRaw = await readContractMethod("get_participant", [walletAddress], methods);
        const parsed = parseParticipant(participantRaw);
        if (!parsed?.participantType || !parsed.participantLabel || parsed.baseEntitlement === null) {
          if (!active) return;
          setSession((current) =>
            current.participant?.source === "contract"
              ? { ...current, participant: null, allocation: null, allocationHistory: [], evaluations: [] }
              : current,
          );
          return;
        }
        let allocation: StoredAllocation | null = null;
        let evaluation: EvaluationRecord | null = null;
        if (methodAvailable("get_current_allocation", methods)) {
          const allocationRaw = await readContractMethod("get_current_allocation", [walletAddress], methods);
          const allocationParsed = parseEvaluation(allocationRaw);
          if (allocationParsed?.stage && allocationParsed.allocation !== null && parsed.participantType) {
            allocation = {
              stage: allocationParsed.stage,
              multiplierBps: multiplierBps(allocationParsed.stage, parsed.participantType),
              baseEntitlement: parsed.baseEntitlement,
              waterUnits: allocationParsed.allocation,
              previousWaterUnits: null,
              policyVersion: POLICY_VERSION,
              evaluationId: allocationParsed.id ?? "contract-allocation",
              appliedAt: "",
              source: "contract",
            };
            if (allocationParsed.id && methodAvailable("get_evaluation", methods)) {
              const evaluationRaw = await readContractMethod("get_evaluation", [allocationParsed.id], methods);
              const evaluationParsed = parseEvaluation(evaluationRaw);
              const record = evaluationRaw && typeof evaluationRaw === "object" ? (evaluationRaw as Record<string, unknown>) : {};
              const urls = Array.isArray(record.evidence_urls)
                ? record.evidence_urls.filter((item): item is string => typeof item === "string")
                : [];
              const contractStatus = typeof record.status === "string" ? record.status : evaluationParsed?.statusLabel;
              const evidenceStatus: EvidenceAssessmentStatus =
                contractStatus === "Disputed" ? "conflict" : contractStatus === "Inconclusive" ? "insufficient" : "consistent";
              evaluation = {
                id: allocationParsed.id,
                mode: "live",
                basinId: parsed.basinId ?? BASIN_ID,
                statusLabel: contractStatus ?? "Contract record",
                evidenceStatus,
                droughtStage: evaluationParsed?.stage ?? allocationParsed.stage,
                reservoirPercent: evaluationParsed?.reservoirPercent ?? allocationParsed.reservoirPercent,
                riverFlowStatus: "Not available",
                sources: [],
                submittedUrls: urls,
                policyVersion: typeof record.policy_version === "string" ? record.policy_version : POLICY_VERSION,
                message:
                  typeof record.message === "string"
                    ? record.message
                    : "This allocation was read from the contract.",
                allocationApplied: record.applied !== false,
                currentAllocation: evaluationParsed?.allocation ?? allocationParsed.allocation,
                previousAllocation: typeof record.previous_allocation === "number" ? record.previous_allocation : null,
                multiplierBps: multiplierBps(allocationParsed.stage, parsed.participantType),
                transactionId: "contract-read",
                contractEvaluationId: allocationParsed.id,
                appealDeadline: null,
                validatorStatus: "Not included in the contract read.",
                finalityStatus: "The allocation was read from the contract. This browser session does not hold the transaction receipt.",
                createdAt: "",
                contractStage: evaluationParsed?.stage ?? allocationParsed.stage,
                contractAllocation: evaluationParsed?.allocation ?? allocationParsed.allocation,
              };
            }
          }
        }
        if (!active) return;
        const participant: ParticipantRecord = {
          id: `chain-${walletAddress.toLowerCase()}`,
          source: "contract",
          walletAddress,
          basinId: parsed.basinId ?? BASIN_ID,
          basinName: BASIN_NAME,
          participantType: parsed.participantType,
          participantLabel: parsed.participantLabel,
          baseEntitlement: parsed.baseEntitlement,
          registeredAt: "",
          transactionId: "contract-read",
        };
        setSession((current) => {
          const pendingWrite = current.transactions.some(
            (item) =>
              item.mode === "live" &&
              (item.phase === "wallet-approval" || item.phase === "submitted" || item.phase === "waiting"),
          );
          if (pendingWrite) return current;
          return {
            ...current,
            participant,
            allocation,
            allocationHistory: allocation ? [allocation] : [],
            evaluations: evaluation ? [evaluation] : [],
          };
        });
      } catch (error) {
        if (active) setActionError(toReadableError(error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [busy, hydrated, wallet.address, wallet.correctNetwork]);

  useEffect(() => {
    if (previousAddress.current && !wallet.address) {
      setSession((current) => ({
        ...current,
        transactions: current.transactions.map((item) => {
          if (item.mode !== "live") return item;
          if (!item.hash && (item.phase === "wallet-approval" || item.phase === "submitted")) {
            return {
              ...item,
              phase: "failed",
              errorMessage: "The wallet disconnected before the transaction was submitted.",
              updatedAt: new Date().toISOString(),
            };
          }
          if (item.hash && (item.phase === "waiting" || item.phase === "submitted")) {
            return {
              ...item,
              errorMessage:
                "The wallet disconnected. The submitted hash is still shown. Rising has not marked it confirmed.",
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        }),
      }));
    }
    previousAddress.current = wallet.address;
  }, [wallet.address]);

  const patchTransaction = useCallback((id: string, partial: Partial<TransactionRecord>) => {
    setSession((current) => {
      const existing = current.transactions.find((item) => item.id === id);
      if (!existing) return current;
      return upsertTransaction(current, { ...existing, ...partial, updatedAt: new Date().toISOString() });
    });
  }, []);

  const playDemo = useCallback(
    async (action: string): Promise<TransactionRecord> => {
      const now = new Date().toISOString();
      let record: TransactionRecord = {
        id: createLocalId("tx"),
        action,
        mode: "demo",
        phase: "preview",
        steps: demoSteps(0),
        finalityStatus: "Not applicable in Demo Mode",
        validatorStatus: "Validators were not asked to process this simulation.",
        evaluationResult: "Simulation only",
        createdAt: now,
        updatedAt: now,
      };
      setSession((current) => upsertTransaction(current, record));
      for (let count = 1; count <= 5; count += 1) {
        await delay(450);
        record = {
          ...record,
          phase: demoPhase(count),
          steps: demoSteps(count),
          updatedAt: new Date().toISOString(),
        };
        setSession((current) => upsertTransaction(current, record));
      }
      return record;
    },
    [],
  );

  const trackLive = useCallback(
    async (id: string, hash: `0x${string}`, transport: "genlayer" | "viem"): Promise<GenLayerObservation> => {
      if (transport === "viem") {
        try {
          const observation = await readViemConfirmation(hash);
          patchTransaction(id, {
            phase: observation.phase === "confirmed" ? "confirmed" : observation.phase === "failed" ? "failed" : "waiting",
            steps: liveSteps({
              approval: "done",
              submitted: "done",
              hash,
              confirmation: observation.phase === "failed" ? "failed" : observation.phase === "confirmed" ? "done" : "active",
              genLayerDetail: null,
            }),
            finalityStatus: observation.finalityStatus,
            validatorStatus: observation.validatorStatus,
            evaluationResult: observation.evaluationResult,
            errorMessage: observation.phase === "failed" ? observation.evaluationResult : undefined,
          });
          return observation;
        } catch (error) {
          const readable = toReadableError(error);
          patchTransaction(id, {
            phase: "waiting",
            errorMessage: readable.message,
            technicalDetail: readable.technical,
            finalityStatus: "The receipt is not available yet. Rising has not marked this transaction confirmed.",
          });
          return {
            statusName: null,
            resultName: null,
            executionResultName: null,
            phase: "waiting",
            finalityStatus: "The receipt is not available yet.",
            validatorStatus: "Detailed GenLayer status is unavailable from the current integration.",
            evaluationResult: readable.message,
            appealDeadline: null,
            detail: null,
          };
        }
      }

      const started = Date.now();
      let latest: GenLayerObservation | null = null;
      while (Date.now() - started < 90_000) {
        latest = await readGenLayerObservation(hash);
        patchTransaction(id, {
          phase: latest.phase === "confirmed" ? "confirmed" : latest.phase === "failed" ? "failed" : "waiting",
          steps: liveSteps({
            approval: "done",
            submitted: "done",
            hash,
            confirmation: latest.phase === "failed" ? "failed" : latest.phase === "confirmed" ? "done" : "active",
            genLayerDetail: latest.detail,
          }),
          finalityStatus: latest.finalityStatus,
          validatorStatus: latest.validatorStatus,
          evaluationResult: latest.evaluationResult,
          errorMessage: latest.phase === "failed" ? latest.evaluationResult : undefined,
        });
        if (latest.phase === "confirmed" || latest.phase === "failed") return latest;
        await delay(3000);
      }
      patchTransaction(id, {
        phase: "waiting",
        errorMessage: "The transaction is still processing. Rising has not marked it confirmed.",
      });
      return (
        latest ?? {
          statusName: null,
          resultName: null,
          executionResultName: null,
          phase: "waiting",
          finalityStatus: "Not confirmed",
          validatorStatus: "Detailed GenLayer status is unavailable from the current integration.",
          evaluationResult: "The transaction is still processing. Do not submit another evaluation yet.",
          appealDeadline: null,
          detail: null,
        }
      );
    },
    [patchTransaction],
  );

  const registerParticipant = useCallback(
    async (value: RegistrationValue) => {
      if (busy || pending(session.transactions, "Register Water Entitlement")) {
        setActionError("A registration is already in progress.");
        return;
      }
      setBusy(true);
      setActionError(null);
      let activeId: string | null = null;
      try {
        if (!risingConfig.liveReady) {
          const transaction = await playDemo("Register Water Entitlement");
          setSession((current) => applyDemoRegistration(current, value, wallet.address, transaction));
          pushToast("success", "Demo registration stored in this browser. No transaction was submitted.");
          return;
        }
        const blocked = liveSubmitBlockReason(wallet);
        if (blocked || !wallet.address) {
          setActionError(blocked ?? "Connect a wallet on GenLayer Studio Next before submitting a transaction.");
          return;
        }
        const id = createLocalId("tx");
        activeId = id;
        const createdAt = new Date().toISOString();
        const initial: TransactionRecord = {
          id,
          action: "Register Water Entitlement",
          mode: "live",
          phase: "wallet-approval",
          steps: liveSteps({ approval: "active", submitted: "pending", hash: null, confirmation: "pending", genLayerDetail: null }),
          finalityStatus: "Waiting for wallet approval",
          validatorStatus: "Waiting for wallet approval",
          createdAt,
          updatedAt: createdAt,
        };
        setSession((current) => upsertTransaction(current, initial));
        const methods = await loadContractMethods();
        setSchemaMethods(methods);
        const written = await writeContractMethod(
          "register_participant",
          [BASIN_ID, value.participantType, value.participantLabel, value.baseEntitlement],
          wallet.address,
          methods,
        );
        patchTransaction(id, {
          hash: written.hash,
          phase: "waiting",
          steps: liveSteps({
            approval: "done",
            submitted: "done",
            hash: written.hash,
            confirmation: "active",
            genLayerDetail: null,
          }),
          finalityStatus: "Waiting for confirmation",
          validatorStatus: "Transaction submitted",
        });
        const observation = await trackLive(id, written.hash, written.transport);
        let participant: ParticipantRecord = {
          id: createLocalId("sim"),
          source: "submitted-unverified",
          walletAddress: wallet.address,
          basinId: BASIN_ID,
          basinName: BASIN_NAME,
          participantType: value.participantType,
          participantLabel: value.participantLabel,
          baseEntitlement: value.baseEntitlement,
          registeredAt: new Date().toISOString(),
          transactionId: id,
          transactionHash: written.hash,
        };
        if (observation.phase === "confirmed" && methodAvailable("get_participant", methods)) {
          try {
            const raw = await readContractMethod("get_participant", [wallet.address], methods);
            const parsed = parseParticipant(raw);
            if (parsed?.participantType && parsed.participantLabel && parsed.baseEntitlement) {
              participant = {
                ...participant,
                source: "contract",
                participantType: parsed.participantType,
                participantLabel: parsed.participantLabel,
                baseEntitlement: parsed.baseEntitlement,
                basinId: parsed.basinId ?? BASIN_ID,
              };
            }
          } catch (error) {
            patchTransaction(id, { technicalDetail: toReadableError(error).technical });
          }
        }
        if (observation.phase === "confirmed") {
          setSession((current) => ({ ...current, participant }));
          pushToast(
            "success",
            participant.source === "contract"
              ? "The transaction is confirmed and the participant was read from the contract."
              : "The transaction is confirmed. The participant could not be read back, so the submitted values are unverified.",
          );
        } else if (observation.phase === "failed") {
          pushToast("error", observation.evaluationResult);
        } else {
          pushToast("info", "The transaction was submitted. Rising has not marked it confirmed.");
        }
      } catch (error) {
        const readable = toReadableError(error);
        if (activeId) {
          patchTransaction(activeId, {
            phase: "failed",
            errorMessage: readable.message,
            technicalDetail: readable.technical,
          });
        }
        if (readable.message === "Your wallet rejected the transaction.") {
          setActionError(null);
          pushToast("error", readable.message);
        } else {
          setActionError(readable.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, patchTransaction, playDemo, pushToast, session.transactions, trackLive, wallet],
  );

  const requestEvaluation = useCallback(
    async (urls: string[]) => {
      if (busy || pending(session.transactions, "Request Drought Evaluation")) {
        setActionError("The evaluation is still processing. Do not submit another evaluation yet.");
        return;
      }
      if (!session.participant) {
        setActionError("Register a fictional water entitlement before requesting an evaluation.");
        return;
      }
      setBusy(true);
      setActionError(null);
      let activeId: string | null = null;
      try {
        if (!risingConfig.liveReady) {
          const transaction = await playDemo("Request Drought Evaluation");
          setSession((current) => applyDemoEvaluation(current, urls, transaction).state);
          pushToast("success", "Demo evaluation completed in this browser. Validators were not asked to process it.");
          return;
        }
        const blocked = liveSubmitBlockReason(wallet);
        if (blocked || !wallet.address) {
          setActionError(blocked ?? "Connect a wallet on GenLayer Studio Next before submitting a transaction.");
          return;
        }
        const id = createLocalId("tx");
        activeId = id;
        const createdAt = new Date().toISOString();
        setSession((current) =>
          upsertTransaction(current, {
            id,
            action: "Request Drought Evaluation",
            mode: "live",
            phase: "wallet-approval",
            steps: liveSteps({ approval: "active", submitted: "pending", hash: null, confirmation: "pending", genLayerDetail: null }),
            finalityStatus: "Waiting for wallet approval",
            validatorStatus: "Waiting for wallet approval",
            createdAt,
            updatedAt: createdAt,
          }),
        );
        const methods = await loadContractMethods();
        setSchemaMethods(methods);
        const written = await writeContractMethod("request_drought_evaluation", [BASIN_ID, urls], wallet.address, methods);
        patchTransaction(id, { hash: written.hash, phase: "submitted" });
        const observation = await trackLive(id, written.hash, written.transport);
        let contractStage = null;
        let contractAllocation: number | null = null;
        let contractEvaluationId: string | null = null;
        let statusFromContract: string | null = null;
        if (observation.phase === "confirmed" && methodAvailable("get_current_allocation", methods)) {
          try {
            const raw = await readContractMethod("get_current_allocation", [wallet.address], methods);
            const parsed = parseEvaluation(raw);
            contractStage = parsed?.stage ?? null;
            contractAllocation = parsed?.allocation ?? null;
            statusFromContract = parsed?.statusLabel ?? null;
          } catch (error) {
            patchTransaction(id, { technicalDetail: toReadableError(error).technical });
          }
        }
        const decision = decideAllocation({
          previous: session.allocation,
          canUpdate: observation.phase === "confirmed" && Boolean(contractStage),
          stage: contractStage,
          evidenceStatus: "consistent",
          baseEntitlement: session.participant.baseEntitlement,
          participantType: session.participant.participantType,
          evaluationId: createLocalId("eval"),
          appliedAt: new Date().toISOString(),
          source: "contract",
          blockedMessage:
            observation.phase === "confirmed"
              ? "The transaction is confirmed, but the contract has not returned a drought stage. The final allocation is not available yet."
              : observation.evaluationResult,
        });
        let message = decision.message;
        if (decision.applied && contractStage && contractAllocation !== null) {
          const local = calculateAllocation(session.participant.baseEntitlement, contractStage, session.participant.participantType);
          if (local !== contractAllocation) {
            message = `The contract allocation is ${contractAllocation} water units. The local policy check is ${local}. Rising is showing the contract amount.`;
          }
        }
        const evaluationId = decision.allocation?.evaluationId ?? createLocalId("eval");
        const evaluation: EvaluationRecord = {
          id: evaluationId,
          mode: "live",
          basinId: BASIN_ID,
          statusLabel:
            statusFromContract ??
            (observation.validatorStatus === "Disputed"
              ? "Disputed"
              : observation.validatorStatus === "Inconclusive"
                ? "Inconclusive"
                : observation.phase === "failed"
                  ? "Failed"
                  : observation.finalityStatus === "Finalized" && observation.phase === "confirmed"
                    ? "Finalized"
                    : observation.phase === "confirmed"
                      ? "Confirmed"
                      : observation.validatorStatus),
          evidenceStatus: "consistent",
          droughtStage: decision.applied ? contractStage : null,
          reservoirPercent: null,
          riverFlowStatus: "Not available",
          sources: [],
          submittedUrls: urls,
          policyVersion: POLICY_VERSION,
          message,
          allocationApplied: decision.applied,
          currentAllocation: contractAllocation ?? decision.currentAllocation,
          previousAllocation: decision.previousAllocation,
          multiplierBps: decision.multiplierBps,
          transactionId: id,
          transactionHash: written.hash,
          contractEvaluationId,
          appealDeadline: observation.appealDeadline,
          validatorStatus: observation.validatorStatus,
          finalityStatus: observation.finalityStatus,
          createdAt: new Date().toISOString(),
          contractStage,
          contractAllocation,
        };
        setSession((current) => ({
          ...current,
          evaluations: [evaluation, ...current.evaluations],
          allocation:
            decision.applied && decision.allocation
              ? {
                  ...decision.allocation,
                  waterUnits: contractAllocation ?? decision.allocation.waterUnits,
                }
              : current.allocation,
          allocationHistory:
            decision.applied && decision.allocation
              ? [
                  { ...decision.allocation, waterUnits: contractAllocation ?? decision.allocation.waterUnits },
                  ...current.allocationHistory,
                ]
              : current.allocationHistory,
        }));
        pushToast(
          observation.phase === "confirmed" ? "success" : observation.phase === "failed" ? "error" : "info",
          observation.phase === "confirmed"
            ? "The evaluation transaction is confirmed."
            : observation.evaluationResult,
        );
      } catch (error) {
        const readable = toReadableError(error);
        if (activeId) {
          patchTransaction(activeId, {
            phase: "failed",
            errorMessage: readable.message,
            technicalDetail: readable.technical,
          });
        }
        if (readable.message === "Your wallet rejected the transaction.") {
          setActionError(null);
          pushToast("error", readable.message);
        } else {
          setActionError(readable.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, patchTransaction, playDemo, pushToast, session.allocation, session.participant, session.scenarioId, session.transactions, trackLive, wallet],
  );

  const submitChallenge = useCallback(
    async (value: ChallengeValue) => {
      if (busy || pending(session.transactions, "Challenge Evaluation")) {
        setActionError("A challenge is already in progress.");
        return;
      }
      setBusy(true);
      setActionError(null);
      let activeId: string | null = null;
      try {
        if (!risingConfig.liveReady) {
          const transaction = await playDemo("Challenge Evaluation");
          setSession((current) => applyChallenge(current, value, transaction, "demo"));
          pushToast("info", "Demo Challenge stored in this browser. The allocation was not changed.");
          return;
        }
        const blocked = liveSubmitBlockReason(wallet);
        if (blocked || !wallet.address) {
          setActionError(blocked ?? "Connect a wallet on GenLayer Studio Next before submitting a transaction.");
          return;
        }
        const id = createLocalId("tx");
        activeId = id;
        const createdAt = new Date().toISOString();
        setSession((current) =>
          upsertTransaction(current, {
            id,
            action: "Challenge Evaluation",
            mode: "live",
            phase: "wallet-approval",
            steps: liveSteps({ approval: "active", submitted: "pending", hash: null, confirmation: "pending", genLayerDetail: null }),
            finalityStatus: "Waiting for wallet approval",
            validatorStatus: "Waiting for wallet approval",
            createdAt,
            updatedAt: createdAt,
          }),
        );
        const methods = await loadContractMethods();
        setSchemaMethods(methods);
        const fn = risingConfig.contractAbi.find((item) => item.type === "function" && item.name === "challenge_evaluation");
        const args: unknown[] = [value.evaluationId, value.alternativeEvidenceUrl, value.reason];
        if (fn?.inputs && fn.inputs.length >= 4) args.push(value.secondEvidenceUrl ?? "");
        const written = await writeContractMethod("challenge_evaluation", args, wallet.address, methods);
        patchTransaction(id, { hash: written.hash });
        const observation = await trackLive(id, written.hash, written.transport);
        const phase = observation.phase === "confirmed" ? "confirmed" : observation.phase === "failed" ? "failed" : "waiting";
        setSession((current) => {
          const existing = current.transactions.find((item) => item.id === id);
          const transaction: TransactionRecord = {
            ...(existing ?? {
              id,
              action: "Challenge Evaluation",
              mode: "live",
              steps: liveSteps({ approval: "done", submitted: "done", hash: written.hash, confirmation: "active", genLayerDetail: observation.detail }),
              createdAt,
              finalityStatus: observation.finalityStatus,
              validatorStatus: observation.validatorStatus,
            }),
            phase,
            hash: written.hash,
            updatedAt: new Date().toISOString(),
          };
          return applyChallenge(current, value, transaction, "live");
        });
        pushToast(
          "info",
          value.secondEvidenceUrl && !(fn?.inputs && fn.inputs.length >= 4)
            ? "The challenge was submitted. The second URL stays in Rising because the method does not list a fourth argument. The allocation was not changed."
            : "The challenge was submitted. The allocation was not changed.",
        );
      } catch (error) {
        const readable = toReadableError(error);
        if (activeId) {
          patchTransaction(activeId, {
            phase: "failed",
            errorMessage: readable.message,
            technicalDetail: readable.technical,
          });
        }
        if (readable.message === "Your wallet rejected the transaction.") {
          setActionError(null);
          pushToast("error", readable.message);
        } else {
          setActionError(readable.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, patchTransaction, playDemo, pushToast, session.transactions, trackLive, wallet],
  );

  const checkTransaction = useCallback(
    async (id: string) => {
      const record = session.transactions.find((item) => item.id === id);
      if (!record?.hash || record.mode !== "live") return;
      setBusy(true);
      try {
        await trackLive(id, record.hash as `0x${string}`, risingConfig.genlayerIntegrationEnabled ? "genlayer" : "viem");
      } finally {
        setBusy(false);
      }
    },
    [session.transactions, trackLive],
  );

  const setScenario = useCallback(
    (id: string) => {
      if (risingConfig.liveReady) return;
      setSession((current) => ({ ...current, scenarioId: id }));
      pushToast("info", "Preview updated. Your saved allocation does not change until you request an evaluation.");
    },
    [pushToast],
  );

  const releaseLocalWait = useCallback((id: string) => {
    patchTransaction(id, {
      released: true,
      errorMessage: "The local wait was released. The transaction was not marked confirmed or failed.",
    });
  }, [patchTransaction]);

  const clearLocalSession = useCallback(() => {
    clearSession();
    setSession(emptySession());
    pushToast("info", "The local session was cleared from this browser. No blockchain transaction was sent.");
  }, [pushToast]);

  const value = useMemo<RisingContextValue>(
    () => ({
      ready: hydrated,
      session,
      busy,
      schemaMethods,
      toasts,
      pushToast,
      dismissToast,
      setScenario,
      registerParticipant,
      requestEvaluation,
      submitChallenge,
      checkTransaction,
      clearLocalSession,
      releaseLocalWait,
      actionError,
      dismissActionError,
    }),
    [
      hydrated,
      session,
      busy,
      schemaMethods,
      toasts,
      pushToast,
      dismissToast,
      setScenario,
      registerParticipant,
      requestEvaluation,
      submitChallenge,
      checkTransaction,
      clearLocalSession,
      releaseLocalWait,
      actionError,
      dismissActionError,
    ],
  );

  return <RisingContext.Provider value={value}>{children}</RisingContext.Provider>;
}

export function useRising(): RisingContextValue {
  const value = useContext(RisingContext);
  if (!value) throw new Error("useRising must be used inside RisingProvider.");
  return value;
}
