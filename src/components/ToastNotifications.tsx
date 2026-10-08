"use client";

import { useEffect } from "react";
import { useRising } from "@/components/RisingProvider";

export function ToastNotifications() {
  const { toasts, dismissToast } = useRising();

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.tone === "error")
      .map((toast) => window.setTimeout(() => dismissToast(toast.id), 8000));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismissToast, toasts]);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 right-4 z-30 flex w-[min(100%-2rem,22rem)] flex-col gap-2 md:bottom-4" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 text-sm shadow-lg ${
            toast.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-950"
              : toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-line bg-white text-navy"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button type="button" className="font-semibold" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
