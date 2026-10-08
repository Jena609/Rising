import type { DroughtStage } from "@/lib/types";

const tones: Record<string, string> = {
  Normal: "border-emerald-300 bg-emerald-50 text-emerald-950",
  Moderate: "border-amber-300 bg-amber-50 text-amber-950",
  Severe: "border-orange-300 bg-orange-50 text-orange-950",
  Emergency: "border-rose-300 bg-rose-50 text-rose-950",
  Disputed: "border-violet-300 bg-violet-50 text-violet-950",
  Inconclusive: "border-slate-300 bg-slate-100 text-slate-700",
  Failed: "border-red-400 bg-red-100 text-red-950",
  Confirmed: "border-emerald-700 bg-emerald-50 text-emerald-950",
  Yes: "border-emerald-300 bg-emerald-50 text-emerald-950",
  No: "border-slate-300 bg-slate-100 text-slate-700",
  "Demo result": "border-sky-300 bg-sky-50 text-sky-950",
  "Simulation only": "border-sky-300 bg-sky-50 text-sky-950",
  "Demo Challenge": "border-sky-300 bg-sky-50 text-sky-950",
};

const stageText: Record<DroughtStage, string> = {
  NORMAL: "Normal",
  MODERATE: "Moderate",
  SEVERE: "Severe",
  EMERGENCY: "Emergency",
};

export function StatusBadge({ label }: { label: string }) {
  const tone = tones[label] ?? "border-line bg-paper text-navy";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: DroughtStage | null }) {
  if (!stage) return <StatusBadge label="Not available" />;
  return <StatusBadge label={stageText[stage]} />;
}
