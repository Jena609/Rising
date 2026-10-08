import Link from "next/link";

export function RisingLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white" aria-label="Rising home">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#12365f" />
        <path d="M6 19c2.5-3 4.2-3 6.7 0s4.2 3 6.7 0 4.2-3 6.6 0" fill="none" stroke="#9fd4ea" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 24h20" stroke="#49a4cc" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-xl tracking-tight">Rising</span>
    </Link>
  );
}
