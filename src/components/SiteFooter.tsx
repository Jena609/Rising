import Link from "next/link";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { BASIN_WARNING } from "@/lib/policy";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-navy">{BASIN_WARNING}</p>
          <LegalDisclaimer />
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm font-semibold text-water">
          <Link href="/policy">Rising Policy v1</Link>
          <Link href="/configuration">Configuration status</Link>
          <Link href="/help">Help and testnet instructions</Link>
        </nav>
      </div>
    </footer>
  );
}
