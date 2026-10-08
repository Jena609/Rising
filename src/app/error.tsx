"use client";

import { ErrorState } from "@/components/ErrorState";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState message="This page could not be displayed." technical={error.message} />
      <button type="button" className="rounded-full bg-water px-4 py-2 text-sm font-semibold text-white" onClick={reset}>
        Try Again
      </button>
    </div>
  );
}
