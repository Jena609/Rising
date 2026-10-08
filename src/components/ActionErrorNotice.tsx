"use client";

import { useEffect } from "react";
import { useRising } from "@/components/RisingProvider";

export function ActionErrorNotice() {
  const { actionError, dismissActionError } = useRising();

  useEffect(() => {
    if (!actionError) return;
    const timer = window.setTimeout(dismissActionError, 8000);
    return () => window.clearTimeout(timer);
  }, [actionError, dismissActionError]);

  if (!actionError) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">
      <p>{actionError}</p>
      <button type="button" className="shrink-0 font-semibold text-navy" onClick={dismissActionError}>
        Close
      </button>
    </div>
  );
}
