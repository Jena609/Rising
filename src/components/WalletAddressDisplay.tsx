"use client";

import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { shortAddress } from "@/lib/format";

export function WalletAddressDisplay() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);
  if (!wallet.address) return <p className="text-sm text-muted">No wallet connected.</p>;

  return (
    <div>
      <button
        type="button"
        className="break-all text-left font-mono text-sm text-navy"
        title={wallet.address}
        onClick={() => {
          void navigator.clipboard?.writeText(wallet.address ?? "").then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {shortAddress(wallet.address)}
        <span className="sr-only"> {wallet.address}</span>
      </button>
      <p className="text-xs text-muted">{copied ? "Address copied." : "Select the address to copy it."}</p>
    </div>
  );
}
