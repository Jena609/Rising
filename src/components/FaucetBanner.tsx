"use client";

import { useState } from "react";
import { WalletAddressDisplay } from "@/components/WalletAddressDisplay";
import { useWallet } from "@/components/WalletProvider";
import { primaryButton, secondaryButton } from "@/components/styles";
import { FAUCET_NOT_CONFIGURED, STUDIO_NEXT, ZERO_GEN_MESSAGE } from "@/lib/studio-next";
import { risingConfig } from "@/lib/config";
import { safeHttpUrl } from "@/lib/urls";

export function FaucetBanner() {
  const wallet = useWallet();
  const [message, setMessage] = useState<string | null>(null);
  const faucet = safeHttpUrl(risingConfig.faucetUrl);

  function openFaucet() {
    if (!faucet) {
      setMessage(FAUCET_NOT_CONFIGURED);
      window.open(STUDIO_NEXT.studioWebApp, "_blank", "noopener,noreferrer");
      return;
    }
    setMessage(
      "The official Studio Next faucet opens in a new tab. Rising does not request test GEN for you and will not say funds arrived until the Studio Next balance changes.",
    );
    window.open(faucet, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="faucet" className="rounded-2xl border border-sky-200 bg-foam p-5" aria-labelledby="faucet-heading">
      <h2 id="faucet-heading" className="font-serif text-2xl text-navy">
        Get Studio Next Test GEN
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink">
        Test GEN is required for transaction fees on GenLayer Studio Next. GenLayer does not publish a separate faucet
        URL for this network. The faucet is the account-selector button inside GenLayer Studio Next. Rising does not
        request the tokens and does not treat a visit as a received payment.
      </p>
      <div className="mt-3">
        <WalletAddressDisplay />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={primaryButton} onClick={openFaucet}>
          Get Studio Next Test GEN
        </button>
        <button type="button" className={secondaryButton} onClick={() => void wallet.refreshBalance()} disabled={!wallet.address}>
          Refresh Balance
        </button>
      </div>
      {!faucet ? <p className="mt-3 text-sm font-semibold text-navy">{FAUCET_NOT_CONFIGURED}</p> : null}
      {message ? <p className="mt-3 text-sm text-navy">{message}</p> : null}
      {wallet.correctNetwork && wallet.balanceStatus === "ready" && wallet.balance === 0n ? (
        <p className="mt-3 text-sm font-semibold text-amber-950">{ZERO_GEN_MESSAGE}</p>
      ) : null}
      {!wallet.address ? <p className="mt-3 text-sm text-muted">Connect a wallet before you request test GEN.</p> : null}
    </section>
  );
}
