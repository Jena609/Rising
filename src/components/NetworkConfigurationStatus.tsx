"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { cardClass } from "@/components/styles";
import { useWallet } from "@/components/WalletProvider";
import { EXPECTED_METHODS, risingConfig } from "@/lib/config";
import { FAUCET_NOT_CONFIGURED } from "@/lib/studio-next";
import { useRising } from "@/components/RisingProvider";

function Row({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3 text-sm">
      <div>
        <p className="font-semibold text-navy">{label}</p>
        {detail ? <p className="text-muted">{detail}</p> : null}
      </div>
      <StatusBadge label={ok ? "Yes" : "No"} />
    </div>
  );
}

export function NetworkConfigurationStatus() {
  const wallet = useWallet();
  const { schemaMethods } = useRising();
  const checks = [
    ["Wallet connected", Boolean(wallet.address)],
    ["Correct network", wallet.correctNetwork],
    ["RPC configured", risingConfig.rpcConfigured],
    ["Chain ID configured", risingConfig.chainIdConfigured],
    ["Contract address configured", risingConfig.contractConfigured],
    ["ABI or GenLayer client configured", risingConfig.abiConfigured || risingConfig.genlayerIntegrationEnabled],
    ["Faucet URL configured", risingConfig.faucetConfigured],
    ["Explorer URL configured", risingConfig.explorerConfigured],
    ["Test GEN balance available", wallet.sufficientBalance],
  ] as const;

  return (
    <section className={cardClass} aria-labelledby="config-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="config-heading" className="font-serif text-2xl text-navy">
          Configuration
        </h2>
        <StatusBadge label={risingConfig.deploymentMode === "live" ? "Live" : "Demo"} />
      </div>
      <dl className="mt-4 text-sm">
        <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted">Deployment mode</dt>
          <dd>{risingConfig.deploymentMode}</dd>
          <dt className="text-muted">Network name</dt>
          <dd>{risingConfig.networkName}</dd>
          <dt className="text-muted">Canonical name</dt>
          <dd>studio-dev</dd>
          <dt className="text-muted">Chain ID</dt>
          <dd>{risingConfig.chainId}</dd>
          <dt className="text-muted">RPC URL</dt>
          <dd className="break-all">{risingConfig.rpcUrl}</dd>
          <dt className="text-muted">Explorer URL</dt>
          <dd className="break-all">{risingConfig.blockExplorerUrl}</dd>
        </div>
      </dl>
      <div className="mt-2">
        <Row label="RPC URL configured" ok={risingConfig.rpcConfigured} />
        <Row label="Chain ID configured" ok={risingConfig.chainIdConfigured} detail={risingConfig.chainIdConfigured ? undefined : "Invalid or missing chain IDs keep Rising in Demo Mode."} />
        <Row
          label="Faucet URL configured"
          ok={risingConfig.faucetConfigured}
          detail={risingConfig.faucetConfigured ? undefined : FAUCET_NOT_CONFIGURED}
        />
        <Row label="Explorer URL configured" ok={risingConfig.explorerConfigured} />
        <Row label="Contract address configured" ok={risingConfig.contractConfigured} />
        <Row label="ABI configured" ok={risingConfig.abiConfigured} />
        <Row label="GenLayer integration enabled" ok={risingConfig.genlayerIntegrationEnabled} />
        <Row label="Wallet connected" ok={Boolean(wallet.address)} />
        <Row label="Correct network" ok={wallet.correctNetwork} />
        <Row label="Sufficient test GEN" ok={wallet.sufficientBalance} />
      </div>
      <h3 className="mt-6 font-semibold text-navy">Live Mode readiness</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {checks.map(([label, ok]) => (
          <li key={label}>
            {ok ? "Ready" : "Missing"} — {label}
          </li>
        ))}
      </ul>
      <h3 className="mt-6 font-semibold text-navy">Contract methods</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {EXPECTED_METHODS.map((method) => {
          const present = schemaMethods ? schemaMethods.includes(method) : risingConfig.contractAbi.some((item) => item.type === "function" && item.name === method);
          return (
            <li key={method}>
              {present ? "Present" : "Not in the configured interface"} — {method}
            </li>
          );
        })}
      </ul>
      {risingConfig.issues.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-semibold text-navy">Configuration messages</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {risingConfig.issues.map((issue) => (
              <li key={`${issue.field}-${issue.detail}`}>{issue.detail}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-emerald-900">All required Live Mode settings are present. Transactions still need your wallet approval.</p>
      )}
    </section>
  );
}
