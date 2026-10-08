"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LandingGate } from "@/components/LandingGate";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ModeBanner } from "@/components/ModeBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const entranceKey = "rising.entrance.v1";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [skipGate, setSkipGate] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(entranceKey) === "1") setSkipGate(true);
  }, []);

  const showGate = pathname === "/" && !skipGate;

  useEffect(() => {
    if (!showGate) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showGate]);

  function enter() {
    if (leaving) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.sessionStorage.setItem(entranceKey, "1");
      setSkipGate(true);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      window.sessionStorage.setItem(entranceKey, "1");
      setSkipGate(true);
      setLeaving(false);
    }, 900);
  }

  return (
    <>
      {showGate ? <LandingGate leaving={leaving} onEnter={enter} /> : null}
      <div className={showGate ? (leaving ? "app-reveal" : "app-held") : undefined} inert={showGate && !leaving ? true : undefined}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <ModeBanner />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <SiteFooter />
        <MobileNavigation />
      </div>
    </>
  );
}
