"use client";

import { BasinNotice } from "@/components/BasinStatusCard";
import { EvidencePanel } from "@/components/EvidencePanel";
import { PageHeader } from "@/components/PageHeader";

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence"
        title="Evidence used for the preview"
        lede="Every source shows its value, time, role, and freshness. Conflicting or stale sources do not change the allocation."
      />
      <BasinNotice />
      <EvidencePanel />
    </div>
  );
}
