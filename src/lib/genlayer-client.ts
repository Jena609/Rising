import { createPublicClient, createWalletClient, custom, http, type Abi, type Address, type Chain } from "viem";
import { abiFunction, methodAvailable, risingConfig, type ExpectedMethod } from "@/lib/config";
import { configuredViemChain } from "@/lib/chain";
import { observeGenLayerTransaction, unavailableObservation, type GenLayerObservation } from "@/lib/genlayer-status";
import { BRADBURY_CHAIN_ID, LOCALNET_CHAIN_ID, STUDIO_NEXT, STUDIONET_CHAIN_ID } from "@/lib/studio-next";
import { getActiveWalletProvider } from "@/lib/selected-wallet";
import { isTransactionHash } from "@/lib/urls";

type SdkChain = Chain & {
  isStudio?: boolean;
  consensusMainContract?: { address?: string } | null;
};

/**
 * Studio Next client chain for genlayer-js 1.1.8.
 * That release has no studioDevnet export. The Studionet consensus contract has no
 * code on chain 61997, so this chain does not copy it. Writes fail honestly until a
 * matching Studio Next consensus deployment is present in the SDK.
 */
export function genLayerClientChain(source?: SdkChain): Chain & { isStudio: true } {
  if (source) {
    const forbidden =
      source.id === BRADBURY_CHAIN_ID || source.id === STUDIONET_CHAIN_ID || source.id === LOCALNET_CHAIN_ID;
    if (forbidden || source.id !== STUDIO_NEXT.chainId || source.isStudio !== true) {
      throw new ContractIntegrationError("Rising only connects to GenLayer Studio Next, chain ID 61997.");
    }
  }
  const base = source && source.id === STUDIO_NEXT.chainId ? source : {};
  return {
    ...base,
    id: STUDIO_NEXT.chainId,
    name: STUDIO_NEXT.name,
    nativeCurrency: {
      name: STUDIO_NEXT.currencyName,
      symbol: STUDIO_NEXT.currencySymbol,
      decimals: STUDIO_NEXT.decimals,
    },
    rpcUrls: { default: { http: [STUDIO_NEXT.rpcUrl] } },
    blockExplorers: { default: { name: "GenLayer Studio Next Explorer", url: STUDIO_NEXT.explorerUrl } },
    testnet: true,
    isStudio: true,
    consensusMainContract: source?.id === STUDIO_NEXT.chainId ? source.consensusMainContract ?? null : null,
  } as Chain & { isStudio: true };
}

export class ContractIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractIntegrationError";
  }
}

interface GenClient {
  readContract: (args: {
    address: Address;
    functionName: string;
    args?: unknown[];
  }) => Promise<unknown>;
  writeContract: (args: {
    address: Address;
    functionName: string;
    args?: unknown[];
    value: bigint;
    account?: Address;
  }) => Promise<unknown>;
  getTransaction: (args: { hash: string }) => Promise<unknown>;
  getContractSchema: (address: Address) => Promise<{ methods?: Record<string, { params?: unknown[] }> }>;
}

export interface PreparedCall {
  method: ExpectedMethod;
  args: unknown[];
  schemaMethods: string[] | null;
}

function requireLiveConfig(): Address {
  if (!risingConfig.liveReady || !risingConfig.contractAddress) {
    throw new ContractIntegrationError(
      "Live contract integration is not configured. This screen is currently in Demo Mode.",
    );
  }
  return risingConfig.contractAddress;
}

function provider(): EthereumProvider {
  const selected = getActiveWalletProvider();
  if (!selected) {
    throw new ContractIntegrationError("No browser wallet was found.");
  }
  return selected;
}

async function genClient(account?: Address, requireWallet = false): Promise<GenClient> {
  if (!risingConfig.genlayerIntegrationEnabled) {
    throw new ContractIntegrationError("GenLayer integration is not enabled.");
  }
  const chain = configuredViemChain();
  if (!chain) {
    throw new ContractIntegrationError("The GenLayer RPC URL or chain ID has not been configured yet.");
  }
  if (chain.id !== STUDIO_NEXT.chainId) {
    throw new ContractIntegrationError("Rising requires GenLayer Studio Next, chain ID 61997.");
  }
  if (requireWallet) provider();
  const [mod, sources] = await Promise.all([
    import("genlayer-js") as Promise<{ createClient: (config: unknown) => GenClient }>,
    import("genlayer-js/chains") as Promise<{ studioDevnet?: SdkChain }>,
  ]);
  const studioDevnet = sources.studioDevnet;
  return mod.createClient({
    chain: studioDevnet ? genLayerClientChain(studioDevnet) : genLayerClientChain(),
    endpoint: STUDIO_NEXT.rpcUrl,
    account,
    provider: getActiveWalletProvider() ?? undefined,
  });
}

export async function loadContractMethods(): Promise<string[] | null> {
  if (!risingConfig.liveReady || !risingConfig.genlayerIntegrationEnabled || !risingConfig.contractAddress) {
    return risingConfig.abiConfigured ? risingConfig.contractAbi.filter((item) => item.type === "function" && item.name).map((item) => item.name as string) : null;
  }
  try {
    const client = await genClient();
    const schema = await client.getContractSchema(risingConfig.contractAddress);
    const names = schema?.methods ? Object.keys(schema.methods) : [];
    return names;
  } catch {
    if (risingConfig.abiConfigured) {
      return risingConfig.contractAbi.filter((item) => item.type === "function" && item.name).map((item) => item.name as string);
    }
    return null;
  }
}

export function assertMethod(method: ExpectedMethod, schemaMethods: string[] | null): void {
  if (!methodAvailable(method, schemaMethods)) {
    throw new ContractIntegrationError(
      `Live contract integration is not configured. The method ${method} is not in the configured contract interface.`,
    );
  }
}

function extractHash(value: unknown): `0x${string}` {
  if (typeof value === "string" && isTransactionHash(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["hash", "transactionHash", "txHash", "txId"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && isTransactionHash(candidate)) return candidate;
    }
  }
  throw new ContractIntegrationError(
    "No transaction hash was returned, so Rising cannot confirm this transaction. Check your wallet activity. Nothing was marked confirmed.",
  );
}

export async function writeContractMethod(
  method: ExpectedMethod,
  args: unknown[],
  account: Address,
  schemaMethods: string[] | null,
): Promise<{ hash: `0x${string}`; transport: "genlayer" | "viem" }> {
  const address = requireLiveConfig();
  assertMethod(method, schemaMethods);
  if (risingConfig.genlayerIntegrationEnabled) {
    const client = await genClient(account, true);
    const result = await client.writeContract({
      address,
      functionName: method,
      args,
      value: 0n,
      account,
    });
    return { hash: extractHash(result), transport: "genlayer" };
  }
  const chain = configuredViemChain();
  const fn = abiFunction(risingConfig.contractAbi, method);
  if (!chain || !fn) {
    throw new ContractIntegrationError(
      "Live contract integration is not configured. This screen is currently in Demo Mode.",
    );
  }
  const walletClient = createWalletClient({
    account,
    chain,
    transport: custom(provider()),
  });
  const hash = await walletClient.writeContract({
    address,
    abi: risingConfig.contractAbi as Abi,
    functionName: method,
    args,
    account,
  });
  return { hash: extractHash(hash), transport: "viem" };
}

export async function readContractMethod(method: ExpectedMethod, args: unknown[], schemaMethods: string[] | null): Promise<unknown> {
  const address = requireLiveConfig();
  assertMethod(method, schemaMethods);
  if (risingConfig.genlayerIntegrationEnabled) {
    const client = await genClient();
    return client.readContract({ address, functionName: method, args });
  }
  const chain = configuredViemChain();
  const fn = abiFunction(risingConfig.contractAbi, method);
  if (!chain || !fn) {
    throw new ContractIntegrationError("The contract read method is not configured.");
  }
  const client = createPublicClient({ chain, transport: http(risingConfig.rpcUrl) });
  return client.readContract({
    address,
    abi: risingConfig.contractAbi as Abi,
    functionName: method,
    args,
  });
}

async function resolveNames(tx: unknown): Promise<unknown> {
  if (!tx || typeof tx !== "object") return tx;
  const record = { ...(tx as Record<string, unknown>) };
  if (typeof record.statusName === "string" || typeof record.status !== "number") return record;
  try {
    const types = (await import("genlayer-js/types")) as {
      transactionsStatusNumberToName?: Record<string, string>;
      executionResultNumberToName?: Record<string, string>;
      transactionResultNumberToName?: Record<string, string>;
    };
    const status = types.transactionsStatusNumberToName?.[String(record.status)];
    if (status) record.statusName = status;
    if (typeof record.txExecutionResult === "number" && !record.txExecutionResultName) {
      record.txExecutionResultName = types.executionResultNumberToName?.[String(record.txExecutionResult)];
    }
    if (typeof record.result === "number" && !record.resultName) {
      record.resultName = types.transactionResultNumberToName?.[String(record.result)];
    }
  } catch {
    return record;
  }
  return record;
}

export async function readGenLayerObservation(hash: `0x${string}`): Promise<GenLayerObservation> {
  if (!risingConfig.genlayerIntegrationEnabled) return unavailableObservation();
  try {
    const client = await genClient();
    const tx = await resolveNames(await client.getTransaction({ hash }));
    return observeGenLayerTransaction(tx) ?? unavailableObservation();
  } catch {
    return unavailableObservation();
  }
}

export async function readViemConfirmation(hash: `0x${string}`): Promise<GenLayerObservation> {
  const chain = configuredViemChain();
  if (!chain) return unavailableObservation();
  const client = createPublicClient({ chain, transport: http(risingConfig.rpcUrl) });
  const receipt = await client.getTransactionReceipt({ hash });
  if (receipt.status === "success") {
    return {
      ...unavailableObservation(),
      phase: "confirmed",
      evaluationResult: "The transaction receipt succeeded. Detailed GenLayer status is unavailable from the current integration.",
      finalityStatus: "Detailed GenLayer status is unavailable from the current integration.",
      validatorStatus: "Detailed GenLayer status is unavailable from the current integration.",
    };
  }
  return {
    ...unavailableObservation(),
    phase: "failed",
    evaluationResult: "The transaction receipt failed.",
    finalityStatus: "Not confirmed",
    validatorStatus: "Detailed GenLayer status is unavailable from the current integration.",
  };
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
