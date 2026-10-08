"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Basin", "/basin"],
  ["Register", "/register"],
  ["Evaluate", "/evaluation"],
  ["Evidence", "/evidence"],
  ["Help", "/help"],
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white md:hidden" aria-label="Mobile sections">
      <ul className="grid grid-cols-5">
        {items.map(([label, href]) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block px-1 py-3 text-center text-xs font-semibold ${active ? "text-water" : "text-navy"}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
