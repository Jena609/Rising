import { DemoModeBanner } from "@/components/DemoModeBanner";
import { LiveModeBanner } from "@/components/LiveModeBanner";

export function ModeBanner() {
  return (
    <div className="border-b border-line bg-white px-4 py-1.5 text-xs font-semibold text-navy" role="status" data-testid="mode-status">
      <DemoModeBanner />
      <LiveModeBanner />
    </div>
  );
}
