import { formatUnits } from "viem";

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatWaterUnits(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Not available";
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(time) + " UTC";
}

export function formatGen(value: bigint, decimals: number): string {
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmedFraction = fraction.replace(/0+$/, "").slice(0, 6);
  const withCommas = new Intl.NumberFormat("en-US").format(BigInt(whole));
  return trimmedFraction ? `${withCommas}.${trimmedFraction}` : withCommas;
}

export function chainIdToHex(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}`;
}

export function formatChain(chainId: number | null): string {
  if (chainId === null) return "Not configured";
  return `${chainId} (${chainIdToHex(chainId)})`;
}
