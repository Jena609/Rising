import { risingConfig } from "@/lib/config";

export function DemoModeBanner() {
  if (risingConfig.deploymentMode !== "demo") return null;
  return <p className="mx-auto max-w-6xl" data-testid="demo-banner">Studio Next • Demo Mode</p>;
}
