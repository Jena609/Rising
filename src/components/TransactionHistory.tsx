"use client";

import { EmptyState } from "@/components/EmptyState";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useRising } from "@/components/RisingProvider";
import { formatDateTime } from "@/lib/format";

export function TransactionHistory() {
  const { session } = useRising();
  if (session.transactions.length === 0) {
    return <EmptyState title="No transactions" body="Registration, evaluation, and challenge activity will appear here. Demo entries are labeled Simulation only and have no hash." />;
  }
  return (
    <div className="space-y-4">
      {session.transactions.map((record) => (
        <div key={record.id}>
          <p className="mb-2 text-xs text-muted">{formatDateTime(record.createdAt)}</p>
          <TransactionStatus record={record} />
        </div>
      ))}
    </div>
  );
}
