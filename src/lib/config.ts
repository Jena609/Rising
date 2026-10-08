import { isAddress, type Address } from "viem";
import bundledAbi from "@/config/contract-abi.json";
import {
  CONTRACT_NOT_CONFIGURED,
  FAUCET_NOT_CONFIGURED,
  STUDIO_NEXT,
  STUDIONET_RISING_CONTRACT,
} from "@/lib/studio-next";
import { isPlaceholderValue, safeHttpUrl } from "@/lib/urls";

export const CONFIG_PLACEHOLDERS = {
  networkName: "GenLayer Testnet",
  rpcUrl: "REPLACE_WITH_GENLAYER_RPC_URL",
  chainId: "REPLACE_WITH_GENLAYER_CHAIN_ID",
  nativeCurrencyName: "GEN",
  nativeCurrencySymbol: "GEN",
  blockExplorerUrl: "REPLACE_WITH_GENLAYER_EXPLORER_URL",
  faucetUrl: "REPLACE_WITH_OFFICIAL_GENLAYER_FAUCET_URL",
  intelligentContractAddress: "REPLACE_WITH_DEPLOYED_CONTRACT_ADDRESS",
  deploymentMode: "demo" as const,
  contractAbi: [] as AbiFunction[],
  genlayerIntegrationEnabled: false,
};

export interface AbiInput {
  name?: string;
  type?: string;
}

export interface AbiFunction {
  type: string;
  name?: string;
  stateMutability?: string;
  inputs?: AbiInput[];
  outputs?: AbiInput[];
}

export interface ConfigIssue {
  field: string;
  label: string;
  detail: string;
}

export interface RisingConfig {
  networkName: string;
  rpcUrl: string;
  chainId: string;
  nativeCurrencyName: string;
  nativeCurrencySymbol: string;
  nativeCurrencyDecimals: number;
  blockExplorerUrl: string;
  explorerTxUrlTemplate: string;
  faucetUrl: string;
  intelligentContractAddress: string;
  deploymentMode: "demo" | "live";
  contractAbi: AbiFunction[];
  genlayerIntegrationEnabled: boolean;
  parsedChainId: number | null;
  contractAddress: Address | null;
  issues: ConfigIssue[];
  missingLabels: string[];
  rpcConfigured: boolean;
  chainIdConfigured: boolean;
  faucetConfigured: boolean;
  explorerConfigured: boolean;
  contractConfigured: boolean;
  abiConfigured: boolean;
  liveReady: boolean;
  secretLeak: boolean;
}

export const EXPECTED_METHODS = [
  "register_participant",
  "get_participant",
  "request_drought_evaluation",
  "get_current_allocation",
  "get_evaluation",
  "challenge_evaluation",
] as const;

export type ExpectedMethod = (typeof EXPECTED_METHODS)[number];

function read(env: Record<string, string | undefined>, key: string, fallback: string): string {
  const value = env[key];
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  return value.trim();
}

export function parseAbi(raw: unknown): { abi: AbiFunction[]; error?: string } {
  if (raw === undefined || raw === null || raw === "") return { abi: [] };
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { abi: [], error: "The contract ABI is not valid JSON." };
    }
  }
  if (Array.isArray(value)) return { abi: value as AbiFunction[] };
  if (value && typeof value === "object" && Array.isArray((value as { abi?: unknown }).abi)) {
    return { abi: (value as { abi: AbiFunction[] }).abi };
  }
  return { abi: [], error: "The contract ABI must be a JSON array." };
}

export function abiHasFunction(abi: readonly AbiFunction[], name: string): boolean {
  return abi.some((item) => item && item.type === "function" && item.name === name);
}

export function abiFunction(abi: readonly AbiFunction[], name: string): AbiFunction | null {
  return abi.find((item) => item && item.type === "function" && item.name === name) ?? null;
}

function sameUrl(left: string, right: string): boolean {
  const a = safeHttpUrl(left);
  const b = safeHttpUrl(right);
  if (!a || !b) return false;
  return a.replace(/\/$/, "") === b.replace(/\/$/, "");
}

function studioNextExplorerTemplate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.includes("{hash}")) return "";
  const probe = trimmed.replaceAll("{hash}", `0x${"11".repeat(32)}`);
  let url: URL;
  try {
    url = new URL(probe);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.hostname !== "explorer-studio-dev.genlayer.com") return "";
  return trimmed;
}

function ignoredChainDetail(requestedChainId: string): string {
  if (requestedChainId === "4221") {
    return "Chain ID 4221 is Bradbury. Rising ignores it and uses GenLayer Studio Next, chain ID 61997.";
  }
  if (requestedChainId === "61999") {
    return "Chain ID 61999 is Studionet. Rising ignores it and uses GenLayer Studio Next, chain ID 61997.";
  }
  if (requestedChainId === "61127") {
    return "Chain ID 61127 is Localnet. Rising ignores it and uses GenLayer Studio Next, chain ID 61997.";
  }
  return "Rising uses GenLayer Studio Next only. A different chain ID was ignored. The expected chain ID is 61997.";
}

export function resolveConfig(env: Record<string, string | undefined>): RisingConfig {
  const issues: ConfigIssue[] = [];
  const networkName = STUDIO_NEXT.name;
  const rpcUrl = STUDIO_NEXT.rpcUrl;
  const chainId = String(STUDIO_NEXT.chainId);
  const parsedChainId = STUDIO_NEXT.chainId;
  const nativeCurrencyName = STUDIO_NEXT.currencyName;
  const nativeCurrencySymbol = STUDIO_NEXT.currencySymbol;
  const nativeCurrencyDecimals = STUDIO_NEXT.decimals;
  const blockExplorerUrl = STUDIO_NEXT.explorerUrl;
  const faucetUrl = "";
  const rpcConfigured = true;
  const chainIdConfigured = true;
  const faucetConfigured = false;
  const explorerConfigured = true;

  issues.push({
    field: "faucetUrl",
    label: "Faucet URL",
    detail: FAUCET_NOT_CONFIGURED,
  });

  const requestedChainId = read(env, "NEXT_PUBLIC_GENLAYER_CHAIN_ID", "");
  if (requestedChainId && requestedChainId !== chainId) {
    issues.push({
      field: "chainId",
      label: "Chain ID",
      detail: ignoredChainDetail(requestedChainId),
    });
  }

  const requestedRpc = read(env, "NEXT_PUBLIC_GENLAYER_RPC_URL", "");
  if (requestedRpc && !isPlaceholderValue(requestedRpc) && !sameUrl(requestedRpc, rpcUrl)) {
    issues.push({
      field: "rpcUrl",
      label: "RPC URL",
      detail: "A non-Studio-dev RPC URL was ignored. Rising uses https://studio-dev.genlayer.com/api.",
    });
  }

  const requestedFaucet = read(env, "NEXT_PUBLIC_GENLAYER_FAUCET_URL", "");
  if (requestedFaucet && !isPlaceholderValue(requestedFaucet)) {
    issues.push({
      field: "faucetUrl",
      label: "Faucet URL",
      detail: "A faucet URL in the environment was ignored. GenLayer does not publish a separate Studio Next faucet URL.",
    });
  }

  const requestedExplorer = read(env, "NEXT_PUBLIC_GENLAYER_EXPLORER_URL", "");
  if (requestedExplorer && !isPlaceholderValue(requestedExplorer) && !sameUrl(requestedExplorer, blockExplorerUrl)) {
    issues.push({
      field: "blockExplorerUrl",
      label: "Explorer URL",
      detail: "A non-Studio-dev explorer URL was ignored. Rising uses https://explorer-studio-dev.genlayer.com.",
    });
  }

  const intelligentContractAddress = read(
    env,
    "NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS",
    CONFIG_PLACEHOLDERS.intelligentContractAddress,
  );
  const requestedTemplate = read(env, "NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE", "");
  const explorerTxUrlTemplate = studioNextExplorerTemplate(requestedTemplate);
  if (requestedTemplate && !explorerTxUrlTemplate) {
    issues.push({
      field: "blockExplorerUrl",
      label: "Explorer URL",
      detail:
        "A transaction link template outside the Studio Next explorer was ignored. Rising does not invent a transaction path.",
    });
  }
  const integrationRaw = read(env, "NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED", "false").toLowerCase();

  const genlayerIntegrationEnabled = integrationRaw === "true";
  if (!["true", "false"].includes(integrationRaw)) {
    issues.push({
      field: "genlayerIntegrationEnabled",
      label: "GenLayer integration",
      detail: "Set the GenLayer integration flag to true or false.",
    });
  }

  let contractAddress: Address | null = null;
  if (isPlaceholderValue(intelligentContractAddress)) {
    issues.push({
      field: "intelligentContractAddress",
      label: "Contract address",
      detail: CONTRACT_NOT_CONFIGURED,
    });
  } else if (!isAddress(intelligentContractAddress)) {
    issues.push({
      field: "intelligentContractAddress",
      label: "Contract address",
      detail: "The contract address is not a valid address.",
    });
  } else if (intelligentContractAddress.toLowerCase() === STUDIONET_RISING_CONTRACT.toLowerCase()) {
    issues.push({
      field: "intelligentContractAddress",
      label: "Contract address",
      detail: "That contract address was deployed on Studionet. Rising will not use it on GenLayer Studio Next.",
    });
  } else {
    contractAddress = intelligentContractAddress;
  }
  const contractConfigured = contractAddress !== null;

  const abiRaw = env.NEXT_PUBLIC_GENLAYER_ABI?.trim() ? env.NEXT_PUBLIC_GENLAYER_ABI : bundledAbi;
  const parsedAbi = parseAbi(abiRaw);
  if (parsedAbi.error) {
    issues.push({ field: "contractAbi", label: "Contract ABI", detail: parsedAbi.error });
  }
  const contractAbi = parsedAbi.error ? [] : parsedAbi.abi;
  const abiConfigured = contractAbi.some((item) => item && item.type === "function" && Boolean(item.name));
  if (!abiConfigured && !genlayerIntegrationEnabled) {
    issues.push({
      field: "contractAbi",
      label: "Contract ABI",
      detail: "The contract ABI is empty, and GenLayer integration is not enabled.",
    });
  }

  const secretLeak = Boolean(
    env.NEXT_PUBLIC_PRIVATE_KEY ||
      env.NEXT_PUBLIC_SEED_PHRASE ||
      env.NEXT_PUBLIC_MNEMONIC ||
      env.NEXT_PUBLIC_SECRET_KEY,
  );
  if (secretLeak) {
    issues.push({
      field: "secrets",
      label: "Secrets",
      detail: "A secret was found in a public environment variable. Remove it. Rising will not use it.",
    });
  }

  const requiredOk =
    rpcConfigured &&
    chainIdConfigured &&
    explorerConfigured &&
    contractConfigured &&
    (abiConfigured || genlayerIntegrationEnabled) &&
    !parsedAbi.error &&
    !secretLeak &&
    nativeCurrencyDecimals <= 36;

  const missingLabels = issues
    .filter((issue) =>
      ["rpcUrl", "chainId", "faucetUrl", "blockExplorerUrl", "intelligentContractAddress", "contractAbi"].includes(
        issue.field,
      ),
    )
    .map((issue) => issue.label)
    .filter((label, index, all) => all.indexOf(label) === index);

  return {
    networkName,
    rpcUrl,
    chainId,
    nativeCurrencyName,
    nativeCurrencySymbol,
    nativeCurrencyDecimals,
    blockExplorerUrl,
    explorerTxUrlTemplate,
    faucetUrl,
    intelligentContractAddress: contractConfigured ? intelligentContractAddress : CONFIG_PLACEHOLDERS.intelligentContractAddress,
    deploymentMode: requiredOk ? "live" : "demo",
    contractAbi,
    genlayerIntegrationEnabled,
    parsedChainId,
    contractAddress,
    issues,
    missingLabels,
    rpcConfigured,
    chainIdConfigured,
    faucetConfigured,
    explorerConfigured,
    contractConfigured,
    abiConfigured,
    liveReady: requiredOk,
    secretLeak,
  };
}

// Next.js only inlines NEXT_PUBLIC values when each name is read directly.
// Passing process.env as a whole object leaves the browser bundle in Demo Mode.
export const risingConfig = resolveConfig({
  NEXT_PUBLIC_GENLAYER_NETWORK_NAME: process.env.NEXT_PUBLIC_GENLAYER_NETWORK_NAME,
  NEXT_PUBLIC_GENLAYER_RPC_URL: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL,
  NEXT_PUBLIC_GENLAYER_CHAIN_ID: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID,
  NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_NAME: process.env.NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_NAME,
  NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_SYMBOL,
  NEXT_PUBLIC_GENLAYER_NATIVE_DECIMALS: process.env.NEXT_PUBLIC_GENLAYER_NATIVE_DECIMALS,
  NEXT_PUBLIC_GENLAYER_EXPLORER_URL: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL,
  NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE,
  NEXT_PUBLIC_GENLAYER_FAUCET_URL: process.env.NEXT_PUBLIC_GENLAYER_FAUCET_URL,
  NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS,
  NEXT_PUBLIC_GENLAYER_ABI: process.env.NEXT_PUBLIC_GENLAYER_ABI,
  NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED: process.env.NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED,
  NEXT_PUBLIC_PRIVATE_KEY: process.env.NEXT_PUBLIC_PRIVATE_KEY,
  NEXT_PUBLIC_SEED_PHRASE: process.env.NEXT_PUBLIC_SEED_PHRASE,
  NEXT_PUBLIC_MNEMONIC: process.env.NEXT_PUBLIC_MNEMONIC,
  NEXT_PUBLIC_SECRET_KEY: process.env.NEXT_PUBLIC_SECRET_KEY,
});

export function methodAvailable(name: string, schemaMethods: readonly string[] | null): boolean {
  if (schemaMethods) return schemaMethods.includes(name);
  return abiHasFunction(risingConfig.contractAbi, name);
}
