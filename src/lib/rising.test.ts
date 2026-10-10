import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { decideAllocation } from "@/lib/allocation";
import { resolveConfig } from "@/lib/config";
import {
  allocationOutcomeCopy,
  readConfirmedEvaluation,
  resolveLiveEvaluation,
  type ResolveLiveEvaluationInput,
} from "@/lib/live-evaluation";
import type { StoredAllocation } from "@/lib/types";
import { assessEvidence } from "@/lib/evidence";
import { calculateAllocation, stageFromReservoir } from "@/lib/policy";
import { getScenario } from "@/lib/scenarios";
import { applyChallenge, demoTransaction } from "@/lib/session";
import { emptySession } from "@/lib/storage";
import { completedDemoSteps, demoSteps } from "@/lib/timeline";
import {
  BRADBURY_WALLET_MESSAGE,
  describeWalletNetwork,
  LOCALNET_WALLET_MESSAGE,
  STUDIO_NEXT,
  STUDIONET_RISING_CONTRACT,
  STUDIONET_WALLET_MESSAGE,
  UNSUPPORTED_NETWORK_MESSAGE,
} from "@/lib/studio-next";
import { genLayerClientChain } from "@/lib/genlayer-client";
import { observeGenLayerTransaction } from "@/lib/genlayer-status";
import { assertNoInventedHash, safeHttpUrl } from "@/lib/urls";
import { validateChallenge, validateRegistration } from "@/lib/validation";

const liveEnv = {
  NEXT_PUBLIC_GENLAYER_RPC_URL: "https://rpc.example.test",
  NEXT_PUBLIC_GENLAYER_CHAIN_ID: "1",
  NEXT_PUBLIC_GENLAYER_FAUCET_URL: "https://faucet.example.test",
  NEXT_PUBLIC_GENLAYER_EXPLORER_URL: "https://explorer.example.test",
  NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
  NEXT_PUBLIC_GENLAYER_ABI: JSON.stringify([{ type: "function", name: "register_participant", inputs: [] }]),
  NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED: "false",
};

describe("drought stage", () => {
  it("follows the reservoir bands", () => {
    expect(stageFromReservoir(80)).toBe("NORMAL");
    expect(stageFromReservoir(70.01)).toBe("NORMAL");
    expect(stageFromReservoir(70)).toBe("MODERATE");
    expect(stageFromReservoir(58)).toBe("MODERATE");
    expect(stageFromReservoir(40)).toBe("MODERATE");
    expect(stageFromReservoir(39.99)).toBe("SEVERE");
    expect(stageFromReservoir(30)).toBe("SEVERE");
    expect(stageFromReservoir(20)).toBe("SEVERE");
    expect(stageFromReservoir(19.99)).toBe("EMERGENCY");
    expect(stageFromReservoir(15)).toBe("EMERGENCY");
  });
});

describe("allocation arithmetic", () => {
  it("matches the published farm example and the other multipliers", () => {
    expect(calculateAllocation(1000, "MODERATE", "farm")).toBe(800);
    expect(calculateAllocation(1000, "MODERATE", "household")).toBe(1000);
    expect(calculateAllocation(1000, "MODERATE", "industrial")).toBe(600);
    expect(calculateAllocation(1000, "SEVERE", "farm")).toBe(500);
    expect(calculateAllocation(1000, "SEVERE", "industrial")).toBe(250);
    expect(calculateAllocation(1000, "EMERGENCY", "farm")).toBe(250);
    expect(calculateAllocation(1000, "EMERGENCY", "industrial")).toBe(100);
    expect(calculateAllocation(1000, "NORMAL", "farm")).toBe(1000);
  });
});

describe("evidence", () => {
  it("keeps the previous allocation when sources conflict or are insufficient", () => {
    for (const id of ["conflict", "insufficient"] as const) {
      const scenario = getScenario(id);
      const assessment = assessEvidence(scenario.sources);
      expect(assessment.canUpdateAllocation).toBe(false);
      const decision = decideAllocation({
        previous: {
          stage: "NORMAL",
          multiplierBps: 10000,
          baseEntitlement: 1000,
          waterUnits: 1000,
          previousWaterUnits: null,
          policyVersion: "Rising Policy v1",
          evaluationId: "eval-previous",
          appliedAt: "2026-10-01T00:00:00.000Z",
          source: "demo",
        },
        canUpdate: assessment.canUpdateAllocation,
        stage: assessment.stage,
        evidenceStatus: assessment.status,
        baseEntitlement: 1000,
        participantType: "farm",
        evaluationId: "eval-next",
        appliedAt: "2026-10-07T00:00:00.000Z",
        source: "demo",
        blockedMessage: assessment.message,
      });
      expect(decision.applied).toBe(false);
      expect(decision.allocation?.waterUnits).toBe(1000);
    }
  });

  it("uses the agreed reservoir for the four main scenarios", () => {
    expect(assessEvidence(getScenario("normal").sources).stage).toBe("NORMAL");
    expect(assessEvidence(getScenario("moderate").sources).stage).toBe("MODERATE");
    expect(assessEvidence(getScenario("severe").sources).stage).toBe("SEVERE");
    expect(assessEvidence(getScenario("emergency").sources).stage).toBe("EMERGENCY");
  });
});

describe("Studio Next network", () => {
  it("names chain 61997 and rejects Bradbury, Studionet, Localnet, and other chains", () => {
    expect(describeWalletNetwork(61997)).toMatchObject({
      networkName: "GenLayer Studio Next",
      status: "correct",
      message: "Correct Network",
    });
    expect(describeWalletNetwork(4221).message).toBe(BRADBURY_WALLET_MESSAGE);
    expect(describeWalletNetwork(61999).message).toBe(STUDIONET_WALLET_MESSAGE);
    expect(describeWalletNetwork(61127).message).toBe(LOCALNET_WALLET_MESSAGE);
    expect(describeWalletNetwork(1).message).toBe(UNSUPPORTED_NETWORK_MESSAGE);
  });

  it("builds a Studio Next client chain and refuses other SDK presets", async () => {
    const sources = await import("genlayer-js/chains");
    const chain = genLayerClientChain();
    expect(chain.isStudio).toBe(true);
    expect(chain.id).toBe(61997);
    expect(chain.rpcUrls.default.http).toEqual([STUDIO_NEXT.rpcUrl]);
    expect((chain as { consensusMainContract?: { address?: string } | null }).consensusMainContract).toBeNull();
    expect(() => genLayerClientChain(sources.testnetBradbury)).toThrow(/61997/);
    expect(() => genLayerClientChain(sources.studionet)).toThrow(/61997/);
    expect(() => genLayerClientChain(sources.localnet)).toThrow(/61997/);
    const accepted = genLayerClientChain({
      ...chain,
      id: 61997,
      isStudio: true,
      consensusMainContract: { address: "0x1111111111111111111111111111111111111111" },
    });
    expect(accepted.id).toBe(61997);
    expect(accepted.rpcUrls.default.http).toEqual([STUDIO_NEXT.rpcUrl]);
    expect(accepted.rpcUrls.default.http).not.toBe(chain.rpcUrls.default.http);
  });
});

describe("configuration", () => {
  it("stays in demo mode until a Studio Next contract address is set", () => {
    const config = resolveConfig({});
    expect(config.deploymentMode).toBe("demo");
    expect(config.liveReady).toBe(false);
    expect(config.networkName).toBe("GenLayer Studio Next");
    expect(config.parsedChainId).toBe(61997);
    expect(config.rpcUrl).toBe(STUDIO_NEXT.rpcUrl);
    expect(config.faucetConfigured).toBe(false);
    expect(config.faucetUrl).toBe("");
    expect(config.blockExplorerUrl).toBe(STUDIO_NEXT.explorerUrl);
    expect(config.missingLabels).toEqual(expect.arrayContaining(["Contract address", "Faucet URL"]));
    expect(config.issues.some((issue) => issue.detail.includes("official Studio Next faucet URL"))).toBe(true);
  });

  it("ignores Bradbury, Studionet, and Localnet settings and a Studionet contract address", () => {
    const studionet = resolveConfig({
      ...liveEnv,
      NEXT_PUBLIC_GENLAYER_CHAIN_ID: "61999",
      NEXT_PUBLIC_GENLAYER_RPC_URL: "https://studio.genlayer.com/api",
      NEXT_PUBLIC_GENLAYER_FAUCET_URL: "https://testnet-faucet.genlayer.foundation/",
      NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS: STUDIONET_RISING_CONTRACT,
      NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE: "https://explorer-studio.genlayer.com/tx/{hash}",
    });
    expect(studionet.parsedChainId).toBe(61997);
    expect(studionet.rpcUrl).toBe(STUDIO_NEXT.rpcUrl);
    expect(studionet.faucetUrl).toBe("");
    expect(studionet.contractConfigured).toBe(false);
    expect(studionet.deploymentMode).toBe("demo");
    expect(studionet.explorerTxUrlTemplate).toBe("");
    expect(studionet.issues.some((issue) => issue.detail.includes("61999"))).toBe(true);

    const bradbury = resolveConfig({ ...liveEnv, NEXT_PUBLIC_GENLAYER_CHAIN_ID: "4221" });
    expect(bradbury.parsedChainId).toBe(61997);
    expect(bradbury.issues.some((issue) => issue.detail.includes("4221"))).toBe(true);
    const localnet = resolveConfig({ ...liveEnv, NEXT_PUBLIC_GENLAYER_CHAIN_ID: "61127" });
    expect(localnet.parsedChainId).toBe(61997);
    expect(localnet.issues.some((issue) => issue.detail.includes("61127"))).toBe(true);
  });

  it("keeps contract actions in demo mode without an ABI or GenLayer client", () => {
    const missingAbi = resolveConfig({ ...liveEnv, NEXT_PUBLIC_GENLAYER_ABI: "[]" });
    expect(missingAbi.parsedChainId).toBe(61997);
    expect(missingAbi.deploymentMode).toBe("demo");
  });

  it("enables live mode only when a non-Studionet contract and an interface are present", () => {
    const live = resolveConfig(liveEnv);
    expect(live.deploymentMode).toBe("live");
    expect(live.parsedChainId).toBe(61997);
    expect(live.rpcUrl).toBe(STUDIO_NEXT.rpcUrl);
    expect(live.faucetConfigured).toBe(false);
    const withIntegration = resolveConfig({
      ...liveEnv,
      NEXT_PUBLIC_GENLAYER_ABI: "[]",
      NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED: "true",
    });
    expect(withIntegration.deploymentMode).toBe("live");
    const template = resolveConfig({
      ...liveEnv,
      NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE: "https://explorer-studio-dev.genlayer.com/tx/{hash}",
    });
    expect(template.explorerTxUrlTemplate).toBe("https://explorer-studio-dev.genlayer.com/tx/{hash}");
  });
});

describe("validation", () => {
  it("rejects empty, zero, negative, and unacknowledged registration", () => {
    expect(validateRegistration({ participantType: "", participantLabel: "", baseEntitlement: "", acknowledged: false }).ok).toBe(false);
    expect(validateRegistration({ participantType: "farm", participantLabel: "Farm 004", baseEntitlement: "0", acknowledged: true }).ok).toBe(false);
    expect(validateRegistration({ participantType: "farm", participantLabel: "Farm 004", baseEntitlement: "-5", acknowledged: true }).ok).toBe(false);
    const valid = validateRegistration({ participantType: "farm", participantLabel: "Farm 004", baseEntitlement: "1000", acknowledged: true });
    expect(valid.ok).toBe(true);
  });

  it("validates challenge urls and reason", () => {
    const bad = validateChallenge(
      { evaluationId: "eval-1", alternativeEvidenceUrl: "javascript:alert(1)", secondEvidenceUrl: "", reason: "short", acknowledged: false },
      ["eval-1"],
    );
    expect(bad.ok).toBe(false);
    const good = validateChallenge(
      {
        evaluationId: "eval-1",
        alternativeEvidenceUrl: "https://example.com/rising-demo/newer",
        secondEvidenceUrl: "",
        reason: "The reservoir source appears stale.",
        acknowledged: true,
      },
      ["eval-1"],
    );
    expect(good.ok).toBe(true);
  });
});

describe("demo records", () => {
  it("does not create a transaction hash", () => {
    const transaction = demoTransaction("Register Water Entitlement", "tx-demo-1");
    expect(transaction.hash).toBeUndefined();
    expect(transaction.phase).toBe("completed");
    expect(completedDemoSteps().every((step) => step.detail === "Simulation only")).toBe(true);
    expect(demoSteps(1).some((step) => step.label.toLowerCase().includes("finalized"))).toBe(false);
    assertNoInventedHash(transaction);
    const next = applyChallenge(emptySession(), {
      evaluationId: "eval-1",
      alternativeEvidenceUrl: "https://example.com/rising-demo/newer",
      secondEvidenceUrl: null,
      reason: "The reservoir source appears stale.",
    }, transaction, "demo");
    expect(next.allocation).toBeNull();
    expect(next.challenges[0]?.statusLabel).toBe("Demo Challenge");
    expect(next.challenges[0]?.transactionHash).toBeUndefined();
  });
});

describe("live evaluation record", () => {
  const previous: StoredAllocation = {
    stage: "NORMAL",
    multiplierBps: 10000,
    baseEntitlement: 1000,
    waterUnits: 1000,
    previousWaterUnits: null,
    policyVersion: "Rising Policy v1",
    evaluationId: "eval-1",
    appliedAt: "2026-10-08T00:00:00.000Z",
    source: "contract",
  };
  const base = {
    previous,
    baseEntitlement: 1000,
    participantType: "farm" as const,
    appliedAt: "2026-10-08T12:00:00.000Z",
    transactionId: "tx-live-1",
    transactionHash: `0x${"ab".repeat(32)}`,
    submittedUrls: ["https://rising-kira-68d0.vercel.app/evidence/r58-a.txt"],
    finalityStatus: "Finalized",
    validatorStatus: "Majority agree",
    appealDeadline: null,
    phase: "confirmed" as const,
  };

  function decide(evaluation: unknown, overrides: Partial<ResolveLiveEvaluationInput> = {}) {
    return resolveLiveEvaluation({ ...base, evaluation, ...overrides });
  }

  it("updates the allocation only when the evaluation itself is finalized and applied", () => {
    const outcome = decide({
      evaluation_id: "eval-2",
      status: "Finalized",
      applied: true,
      drought_stage: "MODERATE",
      reservoir_percent: 58,
      allocation: 800,
      previous_allocation: 1000,
      message: "Allocation calculated from the reservoir percentage fetched from the evidence pages and Rising Policy v1.",
      evidence_readings: [{ url: "https://rising-kira-68d0.vercel.app/evidence/r58-a.txt", status: "fresh", reservoir_percent: 58 }],
    });
    expect(outcome.allocationChanged).toBe(true);
    expect(outcome.evaluation.allocationApplied).toBe(true);
    expect(outcome.evaluation.statusLabel).toBe("Finalized");
    expect(outcome.evaluation.evidenceStatus).toBe("consistent");
    expect(outcome.evaluation.droughtStage).toBe("MODERATE");
    expect(outcome.evaluation.reservoirPercent).toBe(58);
    expect(outcome.allocation?.waterUnits).toBe(800);
    expect(outcome.allocation?.evaluationId).toBe("eval-2");
    expect(outcome.evaluation.transactionHash).toBe(base.transactionHash);
    expect(outcome.evaluation.finalityStatus).toBe("Finalized");
    expect(outcome.evaluation.evidenceReadings).toHaveLength(1);
    expect(allocationOutcomeCopy(outcome.evaluation)).toBe("Allocation applied from this evaluation.");
  });

  it("keeps the previous allocation when the new evaluation is disputed", () => {
    const outcome = decide({
      evaluation_id: "eval-3",
      status: "Disputed",
      applied: false,
      drought_stage: "",
      reservoir_percent: null,
      allocation: 1000,
      previous_allocation: 1000,
      message: "Evidence sources conflict. Existing allocations remain active until review is complete.",
      evidence_readings: [
        { url: "https://rising-kira-68d0.vercel.app/evidence/r58-c.txt", status: "fresh", reservoir_percent: 58 },
        { url: "https://rising-kira-68d0.vercel.app/evidence/r30-c.txt", status: "fresh", reservoir_percent: 30 },
      ],
    });
    expect(outcome.allocationChanged).toBe(false);
    expect(outcome.evaluation.allocationApplied).toBe(false);
    expect(outcome.evaluation.statusLabel).toBe("Disputed");
    expect(outcome.evaluation.evidenceStatus).toBe("conflict");
    expect(outcome.evaluation.evidenceStatus).not.toBe("consistent");
    expect(outcome.evaluation.droughtStage).toBeNull();
    expect(outcome.evaluation.contractStage).toBeNull();
    expect(outcome.allocation).toBe(previous);
    expect(outcome.allocation?.waterUnits).toBe(1000);
    expect(outcome.evaluation.transactionHash).toBe(base.transactionHash);
    expect(outcome.evaluation.evidenceReadings).toHaveLength(2);
    expect(allocationOutcomeCopy(outcome.evaluation)).toBe("The previous allocation remains active.");
    expect(`${outcome.evaluation.statusLabel} ${allocationOutcomeCopy(outcome.evaluation)} ${outcome.evaluation.message}`).not.toMatch(
      /applied|consistent/i,
    );
  });

  it("keeps the previous allocation when the new evaluation is inconclusive", () => {
    const outcome = decide({
      evaluation_id: "eval-4",
      status: "Inconclusive",
      applied: false,
      drought_stage: "",
      reservoir_percent: null,
      allocation: 1000,
      previous_allocation: 1000,
      message: "Insufficient current evidence. The previous allocation remains active.",
      evidence_readings: [{ url: "https://rising-kira-68d0.vercel.app/evidence/stale-44.txt", status: "stale", reservoir_percent: 44 }],
    });
    expect(outcome.allocationChanged).toBe(false);
    expect(outcome.evaluation.allocationApplied).toBe(false);
    expect(outcome.evaluation.statusLabel).toBe("Inconclusive");
    expect(outcome.evaluation.evidenceStatus).toBe("insufficient");
    expect(outcome.evaluation.evidenceStatus).not.toBe("consistent");
    expect(outcome.allocation).toBe(previous);
    expect(outcome.evaluation.evidenceReadings).toHaveLength(1);
    expect(`${outcome.evaluation.statusLabel} ${allocationOutcomeCopy(outcome.evaluation)} ${outcome.evaluation.message}`).not.toMatch(
      /applied|consistent/i,
    );
  });

  it("does not treat the previous allocation as a newly applied result when the evaluation record is missing", () => {
    const outcome = decide(null);
    expect(outcome.allocationChanged).toBe(false);
    expect(outcome.evaluation.allocationApplied).toBe(false);
    expect(outcome.evaluation.evidenceStatus).not.toBe("consistent");
    expect(outcome.evaluation.statusLabel).not.toBe("Finalized");
    expect(outcome.allocation).toBe(previous);
  });

  it("reads the latest evaluation id and then that evaluation, not the current allocation", async () => {
    const calls: string[] = [];
    const result = await readConfirmedEvaluation(
      "0x5F85c75F8442b92ba66C30371CEf6cF3D7B4c650",
      ["get_latest_evaluation_id", "get_evaluation", "get_current_allocation"],
      async (method, args) => {
        calls.push(`${method}:${JSON.stringify(args)}`);
        if (method === "get_latest_evaluation_id") return "eval-3";
        return { evaluation_id: "eval-3", status: "Disputed", applied: false, allocation: 1000 };
      },
    );
    expect(calls).toEqual([
      'get_latest_evaluation_id:["0x5F85c75F8442b92ba66C30371CEf6cF3D7B4c650"]',
      'get_evaluation:["eval-3"]',
    ]);
    expect(calls.join(" ")).not.toContain("get_current_allocation");
    expect(result.id).toBe("eval-3");
    const outcome = decide(result.evaluation);
    expect(outcome.evaluation.allocationApplied).toBe(false);
    expect(outcome.allocationChanged).toBe(false);
  });

  it("keeps the confirmed evaluation path from rereading the prior allocation", () => {
    const source = readFileSync(resolve("src/components/RisingProvider.tsx"), "utf8");
    const requestStart = source.indexOf("const requestEvaluation");
    const challengeStart = source.indexOf("const submitChallenge");
    const request = source.slice(requestStart, challengeStart);
    expect(request).toContain("readConfirmedEvaluation");
    expect(request).not.toContain("get_current_allocation");
    expect(request).not.toContain('evidenceStatus: "consistent"');
  });
});

describe("urls and genlayer status", () => {
  it("rejects unsafe urls", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("REPLACE_WITH_GENLAYER_RPC_URL")).toBeNull();
    expect(safeHttpUrl("https://example.com/faucet")).toMatch(/^https:\/\/example.com\/faucet/);
  });

  it("does not mark a transaction finalized before execution succeeds", () => {
    const proposing = observeGenLayerTransaction({ statusName: "PROPOSING" });
    expect(proposing?.phase).toBe("waiting");
    expect(proposing?.validatorStatus).toBe("Leader evaluating");
    const finalizedWithoutExecution = observeGenLayerTransaction({ statusName: "FINALIZED" });
    expect(finalizedWithoutExecution?.phase).toBe("waiting");
    const finalized = observeGenLayerTransaction({
      statusName: "FINALIZED",
      txExecutionResultName: "FINISHED_WITH_RETURN",
      resultName: "MAJORITY_AGREE",
    });
    expect(finalized?.phase).toBe("confirmed");
    expect(finalized?.finalityStatus).toBe("Finalized");
  });
});
