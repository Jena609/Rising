import { risingConfig } from "@/lib/config";

export function LiveModeBanner() {
  if (risingConfig.deploymentMode !== "live") return null;
  return <p className="mx-auto max-w-6xl" data-testid="live-banner">Studio Next • Live Mode</p>;
}
