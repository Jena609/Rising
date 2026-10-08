"use client";

import { useWallet } from "@/components/WalletProvider";
import { cardClass, secondaryButton } from "@/components/styles";
import { ZERO_GEN_MESSAGE } from "@/lib/studio-next";
import { risingConfig } from "@/lib/config";
import { formatGen } from "@/lib/format";

export function WalletBalanceCard() {
  const wallet = useWallet();
  return (
    <section className={cardClass} aria-labelledby="balance-heading">
      <h2 id="balance-heading" className="font-serif text-2xl text-navy">
        Test GEN balance
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Test GEN pays testnet fees. It is not the water allocation and it is not cash.
      </p>
      <p className="mt-4 text-3xl font-semibold text-navy">
        {wallet.balanceStatus === "ready" && wallet.balance !== null
          ? `${formatGen(wallet.balance, risingConfig.nativeCurrencyDecimals)} ${risingConfig.nativeCurrencySymbol}`
          : wallet.balanceStatus === "loading"
            ? "Reading..."
            : "Not available"}
      </p>
      {wallet.balanceError ? <p className="mt-2 text-sm text-rose-800">{wallet.balanceError}</p> : null}
      {wallet.correctNetwork && wallet.balanceStatus === "ready" && wallet.balance === 0n ? (
        <p className="mt-2 text-sm font-semibold text-amber-950">{ZERO_GEN_MESSAGE}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        Balance is read from the Studio Next RPC. A faucet visit is not treated as received test GEN until this balance changes.
      </p>
      <div className="mt-4">
        <button type="button" className={secondaryButton} onClick={() => void wallet.refreshBalance()} disabled={!wallet.address}>
          Refresh Balance
        </button>
      </div>
    </section>
  );
}
