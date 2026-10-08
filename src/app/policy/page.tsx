import { PageHeader } from "@/components/PageHeader";
import { PolicyCard } from "@/components/PolicyCard";
import { BasinNotice } from "@/components/BasinStatusCard";

export default function PolicyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Policy"
        title="Rising Policy v1"
        lede="A fictional allocation policy for Green Valley Basin. The drought stage follows reservoir storage. The allocation follows a fixed multiplier."
      />
      <BasinNotice />
      <PolicyCard detailed />
      <section className="max-w-3xl space-y-3 text-sm leading-6 text-ink">
        <h2 className="font-serif text-2xl text-navy">Calculation</h2>
        <p>Current allocation = base entitlement × participant multiplier.</p>
        <p>
          The product is rounded to the nearest whole water unit. The published examples divide evenly, so 1,000 water
          units at 80% remains 800 water units.
        </p>
        <p>Rising does not ask an AI model to perform that multiplication.</p>
      </section>
    </div>
  );
}
