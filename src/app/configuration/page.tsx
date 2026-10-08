"use client";

import { NetworkConfigurationStatus } from "@/components/NetworkConfigurationStatus";
import { PageHeader } from "@/components/PageHeader";
import { useRising } from "@/components/RisingProvider";
import { WalletStatusPanel } from "@/components/WalletStatusPanel";
import { secondaryButton } from "@/components/styles";

export default function ConfigurationPage() {
  const { clearLocalSession } = useRising();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Network and contract status"
        lede="Rising uses GenLayer Studio Next, chain ID 61997. Live contract actions turn on only after a Studio Next Rising contract address is configured. No private keys are shown."
      />
      <WalletStatusPanel />
      <NetworkConfigurationStatus />
      <button type="button" className={secondaryButton} onClick={clearLocalSession}>
        Clear local session
      </button>
    </div>
  );
}
