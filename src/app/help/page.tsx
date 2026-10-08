import { FaucetBanner } from "@/components/FaucetBanner";
import { PageHeader } from "@/components/PageHeader";
import { WalletBalanceCard } from "@/components/WalletBalanceCard";
import { NetworkSwitchButton } from "@/components/NetworkSwitchButton";
import { risingConfig } from "@/lib/config";
import { DEMO_BANNER } from "@/lib/policy";

const steps = [
  "Open Rising.",
  "Connect a compatible browser wallet from the wallet list.",
  "Switch to GenLayer Studio Next, chain ID 61997. Rising never switches the network by itself.",
  "Open GenLayer Studio Next with Get Studio Next Test GEN and use its official faucet.",
  "Receive test GEN in the faucet. Rising does not perform that request.",
  "Return to Rising and refresh the wallet balance.",
  "Register a fictional water entitlement and approve the wallet transaction.",
  "Wait for the real confirmation. The hash is shown only after the wallet returns one.",
  "View the registered participant. If the contract cannot be read, the values stay marked unverified.",
  "Request a drought evaluation and approve that transaction.",
  "Read the evaluation status the integration actually returns.",
  "View the allocation only when the contract result is available.",
  "Inspect the evidence, and challenge it if a source is wrong. A challenge does not change the allocation immediately.",
];

const important = [
  ["Testnet only", "Rising runs as a GenLayer testnet experiment. It does not move real money."],
  ["No legal water rights are created", "A registration is a fictional entitlement for demonstration."],
  ["Mock data may be used", "Until a live water-data source is configured, basin readings are labeled demo data."],
  ["Blockchain transactions require test GEN", "Test GEN pays fees. It is not the water allocation."],
  [
    "Studio Next contract still required for live writes",
    "Wallet, network, and GEN balance use GenLayer Studio Next. Contract actions run only when a Studio Next Rising contract address is configured.",
  ],
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Help"
        title="Testnet instructions"
        lede="Rising uses GenLayer Studio Next only, chain ID 61997. Connect a wallet on that network. Rising does not switch the network or sign for you."
      />
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <NetworkSwitchButton />
      <div className="grid gap-4 lg:grid-cols-2">
        <FaucetBanner />
        <WalletBalanceCard />
      </div>

      <section className="max-w-3xl" aria-labelledby="important-information">
        <h2 id="important-information" className="font-serif text-2xl text-navy">
          Important Information
        </h2>
        {risingConfig.deploymentMode === "demo" ? <p className="mt-3 text-sm leading-6">{DEMO_BANNER}</p> : null}
        <dl className="mt-4 space-y-3 text-sm leading-6">
          {important.map(([title, body]) => (
            <div key={title}>
              <dt className="font-semibold text-navy">{title}</dt>
              <dd className="text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid max-w-3xl gap-8">
        <article>
          <h2 className="font-serif text-2xl text-navy">What Rising does</h2>
          <p className="mt-3 leading-7 text-ink">
            A participant registers a fictional water entitlement, asks for a drought evaluation, and sees an allocation
            based on Rising Policy v1. Household use is protected in every stage. Farm and industrial shares fall as
            reservoir storage falls.
          </p>
        </article>
        <article>
          <h2 className="font-serif text-2xl text-navy">How the drought evaluation works</h2>
          <p className="mt-3 leading-7 text-ink">
            Reservoir percentage selects the drought stage. The stage selects a multiplier. Current allocation equals
            base entitlement times that multiplier. The multiplication is ordinary deterministic arithmetic. In Demo
            Mode the stage comes from a labeled fictional scenario. In Live Mode the configured Intelligent Contract
            must return the stage before Rising shows a final allocation.
          </p>
        </article>
        <article>
          <h2 className="font-serif text-2xl text-navy">What GenLayer is used for</h2>
          <p className="mt-3 leading-7 text-ink">
            When Live Mode is configured, GenLayer is the place for Intelligent Contract execution, evidence
            evaluation, validator consensus, the drought-stage decision, on-chain state, and a challenge. Rising does
            not describe that consensus as legal truth or as an infallible measurement of the physical basin.
          </p>
        </article>
        <article>
          <h2 className="font-serif text-2xl text-navy">What is stored on-chain</h2>
          <p className="mt-3 leading-7 text-ink">
            A configured contract can store the participant label, participant type, base entitlement, evaluation
            references, and challenge. Demo Mode stores the same preview only in this browser. Rising never stores a
            private key or seed phrase.
          </p>
        </article>
        <article>
          <h2 className="font-serif text-2xl text-navy">Why evidence sources matter</h2>
          <p className="mt-3 leading-7 text-ink">
            An allocation should follow sources that agree and are fresh. If sources conflict, or if evidence is
            missing, stale, or unavailable, Rising keeps the previous allocation and says so. It does not silently pick
            a source.
          </p>
        </article>
        <article>
          <h2 className="font-serif text-2xl text-navy">How to challenge a result</h2>
          <p className="mt-3 leading-7 text-ink">
            Anyone reviewing an evaluation can submit an alternative evidence URL and a reason. The challenge is a
            review request. It does not instantly change the allocation. In Demo Mode it is labeled Demo Challenge and
            is not given a transaction hash.
          </p>
        </article>
      </section>

      <section className="max-w-3xl space-y-3 text-sm leading-6">
        <h2 className="font-serif text-2xl text-navy">What this application does not do</h2>
        <p>It does not create legal water rights or a government allocation.</p>
        <p>It does not ask for a seed phrase or private key, and it does not sign a transaction without your approval.</p>
        <p>It does not invent a transaction hash, a validator result, a faucet payment, or an explorer link.</p>
        <p>It does not treat an AI result as infallible or as a measurement of a real basin.</p>
      </section>
    </div>
  );
}
