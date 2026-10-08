"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRising } from "@/components/RisingProvider";
import { useWallet } from "@/components/WalletProvider";
import { shortAddress } from "@/lib/format";

function safeIcon(icon: string): string | null {
  if (icon.startsWith("data:image/")) return icon;
  if (icon.startsWith("https://")) return icon;
  return null;
}

export function WalletConnectButton() {
  const wallet = useWallet();
  const { pushToast } = useRising();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const toastedError = useRef<string | null>(null);
  const menuId = useId();
  const pickerTitleId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!wallet.pickerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") wallet.closePicker();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [wallet.closePicker, wallet.pickerOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!wallet.connectError) {
      toastedError.current = null;
      return;
    }
    if (toastedError.current === wallet.connectError) return;
    toastedError.current = wallet.connectError;
    pushToast("error", wallet.connectError);
  }, [pushToast, wallet.connectError]);

  function clearCloseTimer() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  async function copyAddress() {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
    } catch {
      setCopyError("The address could not be copied.");
      setCopied(false);
      setCopyNotice(false);
      return;
    }
    setCopyError(null);
    setCopied(true);
    setCopyNotice(true);
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 1200);
    window.setTimeout(() => {
      setCopied(false);
      setCopyNotice(false);
    }, 2200);
  }

  function disconnect() {
    clearCloseTimer();
    setOpen(false);
    setCopied(false);
    setCopyNotice(false);
    setCopyError(null);
    void wallet.disconnect();
  }

  function changeWallet() {
    clearCloseTimer();
    setOpen(false);
    setCopied(false);
    setCopyNotice(false);
    setCopyError(null);
    void wallet.changeWallet();
  }

  const picker = wallet.pickerOpen ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center" role="presentation" onClick={wallet.closePicker}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={pickerTitleId}
        className="max-h-[min(32rem,calc(100vh-2rem))] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 text-ink shadow-xl"
        data-testid="wallet-picker"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={pickerTitleId} className="font-serif text-2xl text-navy">
            Choose a wallet
          </h2>
          <button type="button" className="min-h-11 px-2 text-sm font-semibold text-navy" onClick={wallet.closePicker}>
            Close
          </button>
        </div>
        {wallet.wallets.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-navy">No compatible wallet detected.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {wallet.wallets.map((item) => {
              const icon = safeIcon(item.icon);
              return (
                <li key={item.uuid}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left text-sm font-semibold text-navy hover:bg-foam"
                    onClick={() => void wallet.connectProvider(item.uuid)}
                  >
                    {icon ? <img src={icon} alt="" className="h-8 w-8 rounded-lg" /> : <span className="h-8 w-8 rounded-lg bg-foam" aria-hidden="true" />}
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  ) : null;

  if (wallet.connection === "connecting") {
    return (
      <>
        <button type="button" className={compactConnect} disabled>
          Connecting wallet...
        </button>
        {picker}
      </>
    );
  }

  if (!wallet.address) {
    return (
      <>
        <button type="button" className={compactConnect} onClick={wallet.openPicker}>
          Connect Wallet
        </button>
        {picker}
      </>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${open || copyNotice ? "z-40" : ""}`}>
      <button
        type="button"
        className={addressButton}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">Wallet </span>
        {shortAddress(wallet.address)}
      </button>
      {copyNotice && !open ? (
        <p className={copyToast} role="status">
          Address copied
        </p>
      ) : null}
      {open ? (
        <div id={menuId} role="dialog" aria-label="Wallet" className={menuPanel}>
          <p className="break-all font-mono text-sm leading-6 text-navy">{wallet.address}</p>
          {copyNotice ? (
            <p className="mt-2 text-sm font-semibold text-emerald-900" role="status">
              Address copied
            </p>
          ) : null}
          {copyError ? <p className="mt-2 text-sm text-rose-800">{copyError}</p> : null}
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" className={menuButton} onClick={() => void copyAddress()}>
              {copied ? "Copied" : "Copy Address"}
            </button>
            <button type="button" className={menuButton} onClick={changeWallet}>
              Change Wallet
            </button>
            <button type="button" className={menuButton} onClick={disconnect}>
              Disconnect Wallet
            </button>
          </div>
        </div>
      ) : null}
      {picker}
    </div>
  );
}

const compactConnect =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white px-4 text-sm font-semibold text-navy hover:bg-foam";

const addressButton =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border border-navy/15 bg-white px-3 font-mono text-sm font-semibold text-navy hover:bg-foam";

const menuPanel =
  "absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 text-left text-ink shadow-[0_12px_32px_rgba(12,35,64,0.16)]";

const menuButton =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-foam";

const copyToast =
  "absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow";
