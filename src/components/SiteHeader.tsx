"use client";

import Link from "next/link";
import { useState } from "react";
import { RisingLogo } from "@/components/RisingLogo";
import { WalletConnectButton } from "@/components/WalletConnectButton";

const links = [
  ["Basin", "/basin"],
  ["Register", "/register"],
  ["Evaluation", "/evaluation"],
  ["Evidence", "/evidence"],
  ["Challenge", "/challenge"],
  ["History", "/history"],
  ["Policy", "/policy"],
  ["Status", "/configuration"],
  ["Help", "/help"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-30 bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <RisingLogo />
          <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1 md:flex" aria-label="Primary">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm text-white/90 hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <WalletConnectButton />
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/20 px-3 text-sm font-semibold md:hidden"
              aria-expanded={open}
              aria-controls="mobile-primary"
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>
        {open ? (
          <nav id="mobile-primary" className="grid gap-1 md:hidden" aria-label="Mobile">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-xl px-2 py-2 text-sm hover:bg-white/10" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
