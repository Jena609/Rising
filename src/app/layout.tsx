import type { Metadata } from "next";
import { AppProviders } from "@/components/AppProviders";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rising Water Allocation",
  description: "Transparent water allocation for a changing climate. A GenLayer testnet experiment.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-20 md:pb-0">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
