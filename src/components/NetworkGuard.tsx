"use client";

import { NetworkSwitchButton } from "@/components/NetworkSwitchButton";
import { useWallet } from "@/components/WalletProvider";
import { describeWalletNetwork, ZERO_GEN_MESSAGE, type WalletNetworkStatus } from "@/lib/studio-next";
import { risingConfig } from "@/lib/config";
import { formatChain } from "@/lib/format";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const network = describeWalletNetwork(wallet.chainId);
  return (
    <div className="space-y-4">
      {risingConfig.liveReady && !wallet.address ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Wallet required for a live transaction</p>
          <p className="mt-1">Connect a wallet. Rising will not submit a transaction without your approval.</p>
        </div>
      ) : null}
      {wallet.wrongNetwork ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{networkTitle(network.status)}</p>
          <p className="mt-1">{network.message}</p>
          <p className="mt-1">Connected network: {network.networkName}</p>
          <p>Expected network: {risingConfig.networkName}</p>
          <p>Connected chain: {formatChain(wallet.chainId)}</p>
          <p>Expected chain: {formatChain(risingConfig.parsedChainId)}</p>
          <p>Network status: {network.message}</p>
          <div className="mt-3">
            <NetworkSwitchButton />
          </div>
        </div>
      ) : null}
      {wallet.address && wallet.correctNetwork && wallet.balanceStatus === "ready" && !wallet.sufficientBalance ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Insufficient GEN</p>
          <p className="mt-1">{ZERO_GEN_MESSAGE}</p>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function networkTitle(status: WalletNetworkStatus): string {
  if (status === "bradbury") return "Bradbury";
  if (status === "studionet") return "Studionet";
  if (status === "localnet") return "Localnet";
  if (status === "unsupported") return "Unsupported network";
  return "Wrong Network";
}
