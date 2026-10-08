"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import { readConfiguredBalance } from "@/lib/chain";
import { risingConfig } from "@/lib/config";
import { toReadableError } from "@/lib/errors";
import { chainIdToHex } from "@/lib/format";
import { setActiveWalletProvider, type SelectedEthereumProvider } from "@/lib/selected-wallet";

type WalletConnection = "disconnected" | "connecting" | "connected";
type BalanceStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

export interface DiscoveredWallet {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface WalletContextValue {
  connection: WalletConnection;
  address: Address | null;
  chainId: number | null;
  balance: bigint | null;
  balanceStatus: BalanceStatus;
  balanceError: string | null;
  walletLabel: string;
  connectError: string | null;
  switchError: string | null;
  switching: boolean;
  correctNetwork: boolean;
  wrongNetwork: boolean;
  networkConfigured: boolean;
  sufficientBalance: boolean;
  ready: boolean;
  wallets: DiscoveredWallet[];
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  connectProvider: (uuid: string) => Promise<void>;
  changeWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

interface AnnouncedWallet extends DiscoveredWallet {
  provider: SelectedEthereumProvider;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function parseChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value)) return Number.parseInt(value, 16);
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function readAnnouncement(event: Event): AnnouncedWallet | null {
  const detail = (
    event as CustomEvent<{
      info?: { uuid?: unknown; name?: unknown; icon?: unknown; rdns?: unknown };
      provider?: SelectedEthereumProvider;
    }>
  ).detail;
  const provider = detail?.provider;
  if (!provider || typeof provider.request !== "function") return null;
  const info = detail.info;
  const uuid =
    typeof info?.uuid === "string" && info.uuid
      ? info.uuid
      : typeof info?.rdns === "string" && info.rdns
        ? info.rdns
        : "";
  if (!uuid) return null;
  const name = typeof info?.name === "string" && info.name.trim() ? info.name.trim() : "Browser wallet";
  return {
    uuid,
    name,
    icon: typeof info?.icon === "string" ? info.icon : "",
    rdns: typeof info?.rdns === "string" ? info.rdns : "",
    provider,
  };
}

function rejectionMessage(error: unknown): string {
  const readable = toReadableError(error).message;
  return readable === "The action could not be completed." ? "Your wallet rejected the connection." : readable;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<WalletConnection>("disconnected");
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [label, setLabel] = useState("Browser wallet");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const announced = useRef<AnnouncedWallet[]>([]);
  const selected = useRef<SelectedEthereumProvider | null>(null);
  const selectedUuid = useRef<string | null>(null);
  const epoch = useRef(0);
  const listeners = useRef<{
    provider: SelectedEthereumProvider;
    onAccounts: (...args: unknown[]) => void;
    onChain: (...args: unknown[]) => void;
  } | null>(null);

  const unbind = useCallback(() => {
    const current = listeners.current;
    if (!current) return;
    current.provider.removeListener?.("accountsChanged", current.onAccounts);
    current.provider.removeListener?.("chainChanged", current.onChain);
    listeners.current = null;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setBalanceStatus("idle");
      return;
    }
    if (!risingConfig.rpcConfigured || risingConfig.parsedChainId === null) {
      setBalance(null);
      setBalanceStatus("unavailable");
      setBalanceError("The GEN balance cannot be read until the RPC URL and chain ID are configured.");
      return;
    }
    setBalanceStatus("loading");
    setBalanceError(null);
    try {
      const next = await readConfiguredBalance(address);
      setBalance(next);
      setBalanceStatus("ready");
    } catch (error) {
      setBalance(null);
      setBalanceStatus("error");
      setBalanceError(toReadableError(error).message);
    }
  }, [address]);

  const adopt = useCallback(
    async (accounts: unknown, provider: SelectedEthereumProvider, token: number) => {
    const list = Array.isArray(accounts) ? accounts : [];
    const next = typeof list[0] === "string" && isAddress(list[0]) ? list[0] : null;
    if (token !== epoch.current) return;
    if (!next) {
      epoch.current += 1;
      unbind();
      selected.current = null;
      selectedUuid.current = null;
      setActiveWalletProvider(null);
      setAddress(null);
      setChainId(null);
      setBalance(null);
      setBalanceStatus("idle");
      setConnection("disconnected");
      return;
    }
    setAddress(next);
    setConnection("connected");
    try {
      const hex = await provider.request({ method: "eth_chainId" });
      if (token !== epoch.current) return;
      setChainId(parseChainId(hex));
    } catch {
      if (token !== epoch.current) return;
      setChainId(null);
    }
  },
    [unbind],
  );

  const bind = useCallback(
    (provider: SelectedEthereumProvider, uuid: string, token: number) => {
      unbind();
      selected.current = provider;
      selectedUuid.current = uuid;
      setActiveWalletProvider(provider);
      const onAccounts = (...args: unknown[]) => {
        void adopt(args[0], provider, token);
      };
      const onChain = (...args: unknown[]) => {
        if (token !== epoch.current) return;
        setChainId(parseChainId(args[0]));
      };
      provider.on?.("accountsChanged", onAccounts);
      provider.on?.("chainChanged", onChain);
      listeners.current = { provider, onAccounts, onChain };
    },
    [adopt, unbind],
  );

  const forget = useCallback(
    async (revoke: boolean) => {
      const provider = selected.current;
      epoch.current += 1;
      unbind();
      selected.current = null;
      selectedUuid.current = null;
      setActiveWalletProvider(null);
      setAddress(null);
      setChainId(null);
      setBalance(null);
      setBalanceStatus("idle");
      setBalanceError(null);
      setConnection("disconnected");
      setLabel("Browser wallet");
      setConnectError(null);
      setSwitchError(null);
      if (!revoke || !provider) return;
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Some wallets cannot revoke a site connection. Rising still forgets this session.
      }
    },
    [unbind],
  );

  useEffect(() => {
    function onAnnounce(event: Event) {
      const next = readAnnouncement(event);
      if (!next) return;
      const index = announced.current.findIndex((item) => item.uuid === next.uuid);
      if (index === -1) announced.current = [...announced.current, next];
      else {
        const copy = announced.current.slice();
        copy[index] = next;
        announced.current = copy;
      }
      if (selectedUuid.current === next.uuid && selected.current !== next.provider) {
        selected.current = next.provider;
        setActiveWalletProvider(next.provider);
      }
      setWallets(announced.current.map(({ uuid, name, icon, rdns }) => ({ uuid, name, icon, rdns })));
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    return () => {
      unbind();
      setActiveWalletProvider(null);
    };
  }, [unbind]);

  const openPicker = useCallback(() => {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const connectProvider = useCallback(
    async (uuid: string) => {
      const choice = announced.current.find((item) => item.uuid === uuid);
      if (!choice) return;
      const token = epoch.current + 1;
      epoch.current = token;
      unbind();
      selected.current = null;
      selectedUuid.current = null;
      setActiveWalletProvider(null);
      setPickerOpen(false);
      setConnectError(null);
      setConnection("connecting");
      try {
        const accounts = await choice.provider.request({ method: "eth_requestAccounts" });
        if (token !== epoch.current) return;
        bind(choice.provider, choice.uuid, token);
        setLabel(choice.name);
        await adopt(accounts, choice.provider, token);
      } catch (error) {
        if (token !== epoch.current) return;
        unbind();
        selected.current = null;
        selectedUuid.current = null;
        setActiveWalletProvider(null);
        setConnection("disconnected");
        setConnectError(rejectionMessage(error));
      }
    },
    [adopt, bind, unbind],
  );

  const disconnect = useCallback(async () => {
    setPickerOpen(false);
    await forget(true);
  }, [forget]);

  const changeWallet = useCallback(async () => {
    await forget(true);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setPickerOpen(true);
  }, [forget]);

  const switchNetwork = useCallback(async () => {
    setSwitchError(null);
    const provider = selected.current;
    if (!provider || !address) {
      setSwitchError("Connect a wallet before switching networks.");
      return;
    }
    if (risingConfig.parsedChainId === null || !risingConfig.rpcConfigured) {
      setSwitchError("The GenLayer RPC URL or chain ID has not been configured yet.");
      return;
    }
    setSwitching(true);
    const hex = chainIdToHex(risingConfig.parsedChainId);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
      setChainId(risingConfig.parsedChainId);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? Number((error as { code: unknown }).code) : NaN;
      if (code === 4902) {
        try {
          const params: Record<string, unknown> = {
            chainId: hex,
            chainName: risingConfig.networkName,
            nativeCurrency: {
              name: risingConfig.nativeCurrencyName,
              symbol: risingConfig.nativeCurrencySymbol,
              decimals: risingConfig.nativeCurrencyDecimals,
            },
            rpcUrls: [risingConfig.rpcUrl],
          };
          if (risingConfig.explorerConfigured) params.blockExplorerUrls = [risingConfig.blockExplorerUrl];
          await provider.request({ method: "wallet_addEthereumChain", params: [params] });
          setChainId(risingConfig.parsedChainId);
        } catch (addError) {
          setSwitchError(toReadableError(addError).message);
        }
      } else {
        setSwitchError(code === 4001 ? "The wallet rejected the network switch." : toReadableError(error).message);
      }
    } finally {
      setSwitching(false);
    }
  }, [address]);

  const correctNetwork = Boolean(address && risingConfig.parsedChainId !== null && chainId === risingConfig.parsedChainId);
  const wrongNetwork = Boolean(address && risingConfig.parsedChainId !== null && chainId !== risingConfig.parsedChainId);
  const sufficientBalance = balanceStatus === "ready" && balance !== null && balance > 0n;
  const ready = Boolean(risingConfig.liveReady && correctNetwork && sufficientBalance);

  const value = useMemo<WalletContextValue>(
    () => ({
      connection: address ? "connected" : connection,
      address,
      chainId,
      balance,
      balanceStatus,
      balanceError,
      walletLabel: label,
      connectError,
      switchError,
      switching,
      correctNetwork,
      wrongNetwork,
      networkConfigured: risingConfig.parsedChainId !== null,
      sufficientBalance,
      ready,
      wallets,
      pickerOpen,
      openPicker,
      closePicker,
      connectProvider,
      changeWallet,
      disconnect,
      refreshBalance,
      switchNetwork,
    }),
    [
      address,
      connection,
      chainId,
      balance,
      balanceStatus,
      balanceError,
      label,
      connectError,
      switchError,
      switching,
      correctNetwork,
      wrongNetwork,
      sufficientBalance,
      ready,
      wallets,
      pickerOpen,
      openPicker,
      closePicker,
      connectProvider,
      changeWallet,
      disconnect,
      refreshBalance,
      switchNetwork,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}
