"use client";

import { NetworkSwitchButton } from "@/components/NetworkSwitchButton";
import { useWallet } from "@/components/WalletProvider";
import { cardClass, secondaryButton } from "@/components/styles";
import { risingConfig } from "@/lib/config";
import { formatChain, formatGen } from "@/lib/format";
import { describeWalletNetwork, liveSubmitBlockReason } from "@/lib/studio-next";

export function WalletStatusPanel() {
  const wallet = useWallet();
  const network = describeWalletNetwork(wallet.chainId);
  const balanceText =
    wallet.balanceStatus === "ready" && wallet.balance !== null
      ? `${formatGen(wallet.balance, risingConfig.nativeCurrencyDecimals)} ${risingConfig.nativeCurrencySymbol}`
      : wallet.balanceStatus === "loading"
        ? "Reading balance..."
        : "Not available";
  let readiness = "Connect a wallet before submitting a transaction.";
  if (wallet.address) {
    if (wallet.balanceStatus === "loading" || wallet.balanceStatus === "idle") {
      readiness = "Reading the GEN balance.";
    } else if (wallet.balanceStatus === "error" || wallet.balanceStatus === "unavailable") {
      readiness = wallet.balanceError ?? "The GEN balance is not available.";
    } else if (wallet.ready) {
      readiness = "Ready. Each submission still needs approval in the wallet.";
    } else {
      readiness =
        liveSubmitBlockReason({
          address: wallet.address,
          chainId: wallet.chainId,
          sufficientBalance: wallet.sufficientBalance,
        }) ?? "Not ready for a transaction.";
    }
  }

  return (
    <section className={cardClass} aria-labelledby="wallet-status-heading">
      <h2 id="wallet-status-heading" className="font-serif text-2xl text-navy">
        Wallet
      </h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="text-muted">Full wallet address</dt>
        <dd className="break-all font-mono text-navy">{wallet.address ?? "No wallet connected"}</dd>
        <dt className="text-muted">Wallet</dt>
        <dd>{wallet.address ? wallet.walletLabel : "Not connected"}</dd>
        <dt className="text-muted">Connected network</dt>
        <dd>{wallet.address ? network.networkName : "Not connected"}</dd>
        <dt className="text-muted">Expected network</dt>
        <dd>{risingConfig.networkName}</dd>
        <dt className="text-muted">Chain ID</dt>
        <dd>{wallet.address ? (wallet.chainId === null ? "Unknown" : formatChain(wallet.chainId)) : "Not connected"}</dd>
        <dt className="text-muted">GEN balance</dt>
        <dd>{wallet.address ? balanceText : "Not available"}</dd>
        <dt className="text-muted">Network status</dt>
        <dd>
          {wallet.address ? (
            wallet.wrongNetwork ? (
              <>
                <span>Wrong Network</span>
                <span className="mt-1 block">{network.message}</span>
              </>
            ) : (
              network.message
            )
          ) : (
            "No wallet connected."
          )}
        </dd>
        <dt className="text-muted">Transaction readiness</dt>
        <dd>{readiness}</dd>
      </dl>
      {wallet.balanceError ? <p className="mt-3 text-sm text-rose-800">{wallet.balanceError}</p> : null}
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" className={secondaryButton} onClick={() => void wallet.refreshBalance()} disabled={!wallet.address}>
          Refresh Balance
        </button>
        {wallet.wrongNetwork ? <NetworkSwitchButton /> : null}
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void wallet.disconnect()}
          disabled={!wallet.address}
        >
          Disconnect Wallet
        </button>
      </div>
    </section>
  );
}
