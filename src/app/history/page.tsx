"use client";

import { PageHeader } from "@/components/PageHeader";
import { TransactionHistory } from "@/components/TransactionHistory";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Transaction history"
        lede="Registration, evaluation, and challenge activity. A hash appears only when a wallet or RPC actually returned one."
      />
      <TransactionHistory />
    </div>
  );
}
