"use client";

import { RisingProvider } from "@/components/RisingProvider";
import { ToastNotifications } from "@/components/ToastNotifications";
import { WalletProvider } from "@/components/WalletProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <RisingProvider>
        {children}
        <ToastNotifications />
      </RisingProvider>
    </WalletProvider>
  );
}
