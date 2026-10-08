import { cardClass } from "@/components/styles";
import { formatMultiplier, POLICY_VERSION, STAGE_RULES } from "@/lib/policy";

export function PolicyCard({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className={cardClass} aria-labelledby="policy-heading">
      <h2 id="policy-heading" className="font-serif text-2xl text-navy">
        {POLICY_VERSION}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Household, farm, and industrial multipliers are fixed by the reservoir band. The final multiplication is
        deterministic. This policy is fictional.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3 font-semibold">Stage</th>
              <th className="py-2 pr-3 font-semibold">Reservoir</th>
              <th className="py-2 pr-3 font-semibold">Household</th>
              <th className="py-2 pr-3 font-semibold">Farm</th>
              <th className="py-2 font-semibold">Industrial</th>
            </tr>
          </thead>
          <tbody>
            {STAGE_RULES.map((rule) => (
              <tr key={rule.stage} className="border-b border-line">
                <th className="py-2 pr-3 font-semibold text-navy">{rule.label}</th>
                <td className="py-2 pr-3">{rule.reservoirRule}</td>
                <td className="py-2 pr-3">{formatMultiplier(rule.householdBps)}</td>
                <td className="py-2 pr-3">{formatMultiplier(rule.farmBps)}</td>
                <td className="py-2">{formatMultiplier(rule.industrialBps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detailed ? (
        <div className="mt-4 rounded-xl bg-foam p-4 text-sm leading-6 text-navy">
          <p className="font-semibold">Example</p>
          <p>Farm base entitlement: 1,000 water units.</p>
          <p>Drought stage: Moderate. Multiplier: 80%.</p>
          <p>Current allocation: 800 water units.</p>
        </div>
      ) : null}
    </section>
  );
}
