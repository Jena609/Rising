import { describe, expect, it } from "vitest";
import { decideAllocation } from "@/lib/allocation";
import { resolveConfig } from "@/lib/config";
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
