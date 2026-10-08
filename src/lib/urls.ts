const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.includes("REPLACE_WITH_");
}

export function safeHttpUrl(value: string, options?: { allowLocalHttp?: boolean }): string | null {
  const trimmed = value.trim();
  if (isPlaceholderValue(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url.toString();
  if (
    options?.allowLocalHttp &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return url.toString();
  }
  return null;
}

export function isTransactionHash(value: string | undefined | null): value is `0x${string}` {
  return typeof value === "string" && HASH_RE.test(value);
}

export function explorerTransactionUrl(
  explorerUrl: string,
  hash: string | undefined,
  template: string,
): string | null {
  if (!isTransactionHash(hash)) return null;
  const explorer = safeHttpUrl(explorerUrl);
  if (!explorer) return null;
  const rawTemplate = template.trim();
  if (!rawTemplate || isPlaceholderValue(rawTemplate) || !rawTemplate.includes("{hash}")) {
    return null;
  }
  const candidate = rawTemplate.replaceAll("{hash}", hash);
  return safeHttpUrl(candidate);
}

export function assertNoInventedHash(value: unknown): void {
  const text = JSON.stringify(value);
  if (HASH_RE.test(text) || /0x[0-9a-fA-F]{64}/.test(text)) {
    throw new Error("Demo records must not contain a transaction hash.");
  }
}
