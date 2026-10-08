import { defineChain, http, createPublicClient, type Address, type Chain } from "viem";
import { risingConfig } from "@/lib/config";

export function configuredViemChain(): Chain | null {
  if (!risingConfig.rpcConfigured || risingConfig.parsedChainId === null) return null;
  return defineChain({
    id: risingConfig.parsedChainId,
    name: risingConfig.networkName,
    nativeCurrency: {
      name: risingConfig.nativeCurrencyName,
      symbol: risingConfig.nativeCurrencySymbol,
      decimals: risingConfig.nativeCurrencyDecimals,
    },
    rpcUrls: { default: { http: [risingConfig.rpcUrl] } },
    blockExplorers: risingConfig.explorerConfigured
      ? { default: { name: "Explorer", url: risingConfig.blockExplorerUrl } }
      : undefined,
  });
}

export function balanceClient() {
  const chain = configuredViemChain();
  if (!chain) return null;
  return createPublicClient({ chain, transport: http(risingConfig.rpcUrl) });
}

export async function readConfiguredBalance(address: Address): Promise<bigint> {
  const client = balanceClient();
  if (!client) {
    throw new Error("The GenLayer RPC URL or chain ID has not been configured yet.");
  }
  return client.getBalance({ address });
}
