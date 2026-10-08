"use client";

const waves = [
  {
    className: "wave-back text-[#0a4f78]",
    duration: "32s",
    opacity: 0.55,
    path: "M0 92c48 28 96 36 144 20s96-44 144-40 96 28 144 36 96-8 144-24 96-28 144-12 96 40 144 44 96-20 144-32 96-8 144 8 96 24 144 12v76H0Z",
  },
  {
    className: "wave-mid text-[#1280ad]",
    duration: "22s",
    opacity: 0.42,
    path: "M0 78c60 34 100 18 150-4s90-34 140-18 100 42 150 46 90-22 140-34 110-6 150 14 80 36 140 28 110-30 150-22 90 30 140 22 80-18 140-6v96H0Z",
  },
  {
    className: "wave-front text-[#d7f3fb]",
    duration: "16s",
    opacity: 0.72,
    path: "M0 70c70 22 110 8 160-10s100-24 150-6 100 36 160 34 120-28 160-22 80 24 140 22 120-20 160-6 90 28 140 18 100-24 150-10 80 8 120 2v90H0Z",
  },
];

const sparks = [
  [12, 28, 7],
  [22, 62, 11],
  [38, 18, 5],
  [54, 74, 9],
  [68, 36, 6],
  [78, 58, 13],
  [88, 22, 8],
  [46, 48, 10],
] as const;

export function LandingGate({ leaving, onEnter }: { leaving: boolean; onEnter: () => void }) {
  return (
    <section className={`landing-gate${leaving ? " is-leaving" : ""}`} aria-label="Rising entrance">
      <div className="landing-sky" />
      <div className="landing-glow" />
      <div className="landing-water" aria-hidden="true">
        {waves.map((wave) => (
          <div key={wave.duration} className={`landing-wave ${wave.className}`}>
            <div className="wave-track" style={{ animationDuration: wave.duration }}>
              {[0, 1].map((copy) => (
                <svg key={copy} viewBox="0 0 1200 180" preserveAspectRatio="none">
                  <path fill="currentColor" fillOpacity={wave.opacity} d={wave.path} />
                </svg>
              ))}
            </div>
          </div>
        ))}
        {sparks.map(([left, top, delay]) => (
          <span key={`${left}-${top}`} className="landing-spark" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }} />
        ))}
      </div>

      <div className="landing-copy">
        <p className="landing-kicker rise-in" style={{ animationDelay: "0.35s" }}>
          <RisingMark />
          <span>Testnet</span>
        </p>
        <h1 className="landing-title rise-in" style={{ animationDelay: "0.7s" }}>
          Rising
        </h1>
        <p className="landing-headline rise-in" style={{ animationDelay: "1.05s" }}>
          Transparent water allocation
          <br />
          for a changing climate.
        </p>
        <p className="landing-description rise-in" style={{ animationDelay: "1.35s" }}>
          An evidence-based water allocation experiment built for the GenLayer&nbsp;testnet.
        </p>
        <button type="button" className="enter-rising rise-in" style={{ animationDelay: "1.65s" }} onClick={onEnter} disabled={leaving}>
          Enter Rising
        </button>
        <ul className="landing-points rise-in" style={{ animationDelay: "1.95s" }}>
          <li>GenLayer testnet experiment</li>
          <li>Evidence-based decisions</li>
          <li>Transparent allocation rules</li>
          <li>No legal water rights are created</li>
        </ul>
      </div>
    </section>
  );
}

function RisingMark() {
  return (
    <span className="landing-brand">
      <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#12365f" />
        <path d="M6 19c2.5-3 4.2-3 6.7 0s4.2 3 6.7 0 4.2-3 6.6 0" fill="none" stroke="#9fd4ea" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 24h20" stroke="#49a4cc" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      Rising
    </span>
  );
}
