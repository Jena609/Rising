"use client";

import { useWallet } from "@/components/WalletProvider";
import { secondaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";

export function NetworkSwitchButton() {
  const wallet = useWallet();
  const disabled = wallet.switching || !wallet.address || risingConfig.parsedChainId === null || !risingConfig.rpcConfigured;
  return (
    <div>
      <button type="button" className={secondaryButton} disabled={disabled} onClick={() => void wallet.switchNetwork()}>
        {wallet.switching ? "Waiting for wallet..." : "Switch to Studio Next"}
      </button>
      {wallet.switchError ? <p className="mt-2 text-sm text-rose-800">{wallet.switchError}</p> : null}
      <p className="mt-2 text-sm text-muted">Expected network: {risingConfig.networkName}. Chain ID {risingConfig.parsedChainId}.</p>
    </div>
  );
}
