/**
 * Official GenLayer Studio development preview values from
 * https://docs.genlayer.com/developers/networks
 * Rising connects only to this network.
 */
export const STUDIO_NEXT = {
  name: "GenLayer Studio Next",
  canonicalName: "studio-dev",
  chainId: 61997,
  rpcUrl: "https://studio-dev.genlayer.com/api",
  explorerUrl: "https://explorer-studio-dev.genlayer.com",
  /** Documented Studio web app. The faucet is the account-selector button inside it. */
  studioWebApp: "https://studio-dev.genlayer.com",
  currencyName: "GEN",
  currencySymbol: "GEN",
  decimals: 18,
} as const;

/** Recognition only. Rising does not connect to these networks. */
export const BRADBURY_CHAIN_ID = 4221;
export const STUDIONET_CHAIN_ID = 61999;
export const LOCALNET_CHAIN_ID = 61127;

/** Rising deployment that exists on Studionet. It must not be called on Studio Next. */
export const STUDIONET_RISING_CONTRACT = "0x298c594293E79703c8944e69A0C1973C4fAa5517";

export const CONTRACT_NOT_CONFIGURED =
  "Rising is connected to GenLayer Studio Next, but the Rising Intelligent Contract has not been configured.";

export const ZERO_GEN_MESSAGE =
  "Your wallet is connected to GenLayer Studio Next, but it has 0 GEN. Request Studio Next test GEN before submitting transactions.";

export const FAUCET_NOT_CONFIGURED =
  "The official Studio Next faucet URL has not been configured yet. Open GenLayer Studio Next and use its official faucet.";

export const EVALUATION_NOT_CONFIGURED =
  "Live GenLayer Studio Next evaluation is not configured. This screen is currently in Demo Mode.";

export const BRADBURY_WALLET_MESSAGE =
  "You are connected to Bradbury. Rising requires GenLayer Studio Next on chain ID 61997.";

export const STUDIONET_WALLET_MESSAGE =
  "You are connected to Studionet. Rising requires GenLayer Studio Next on chain ID 61997.";

export const LOCALNET_WALLET_MESSAGE =
  "You are connected to Localnet. Rising requires GenLayer Studio Next on chain ID 61997.";

export const UNSUPPORTED_NETWORK_MESSAGE = "Unsupported network. Please switch to GenLayer Studio Next.";

export const CORRECT_NETWORK_MESSAGE = "Correct Network";

export type WalletNetworkStatus = "correct" | "bradbury" | "studionet" | "localnet" | "unsupported" | "unknown";

export function describeWalletNetwork(chainId: number | null): {
  networkName: string;
  status: WalletNetworkStatus;
  message: string;
} {
  if (chainId === null) {
    return { networkName: "Unknown", status: "unknown", message: "The wallet has not reported a chain ID." };
  }
  if (chainId === STUDIO_NEXT.chainId) {
    return { networkName: STUDIO_NEXT.name, status: "correct", message: CORRECT_NETWORK_MESSAGE };
  }
  if (chainId === BRADBURY_CHAIN_ID) {
    return { networkName: "Bradbury", status: "bradbury", message: BRADBURY_WALLET_MESSAGE };
  }
  if (chainId === STUDIONET_CHAIN_ID) {
    return { networkName: "Studionet", status: "studionet", message: STUDIONET_WALLET_MESSAGE };
  }
  if (chainId === LOCALNET_CHAIN_ID) {
    return { networkName: "Localnet", status: "localnet", message: LOCALNET_WALLET_MESSAGE };
  }
  return { networkName: "Unsupported network", status: "unsupported", message: UNSUPPORTED_NETWORK_MESSAGE };
}

export function liveSubmitBlockReason(input: {
  address: string | null;
  chainId: number | null;
  sufficientBalance: boolean;
}): string | null {
  if (!input.address) return "Connect a wallet on GenLayer Studio Next before submitting a transaction.";
  const network = describeWalletNetwork(input.chainId);
  if (network.status !== "correct") return network.message;
  if (!input.sufficientBalance) return ZERO_GEN_MESSAGE;
  return null;
}
