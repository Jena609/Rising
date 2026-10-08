export interface ReadableError {
  message: string;
  technical: string;
}

function textOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; code?: unknown; shortMessage?: unknown };
    const parts = [record.shortMessage, record.message, record.code]
      .filter((part) => part !== undefined && part !== null)
      .map((part) => String(part));
    if (parts.length > 0) return parts.join(" ");
  }
  return "Unknown error";
}

export function toReadableError(error: unknown): ReadableError {
  const technical = textOf(error);
  const lower = technical.toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error ? Number((error as { code?: unknown }).code) : NaN;

  if (
    code === 4001 ||
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request")
  ) {
    return { message: "Your wallet rejected the transaction.", technical };
  }
  if (code === 4902 || lower.includes("unrecognized chain")) {
    return {
      message: "The wallet does not have the configured network yet. Approve adding it when your wallet asks.",
      technical,
    };
  }
  if (lower.includes("insufficient") || lower.includes("funds")) {
    return { message: "The wallet does not have enough test GEN for this transaction.", technical };
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch") || lower.includes("does not match")) {
    return { message: "The application is connected to the wrong network.", technical };
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return {
      message: "The transaction is still processing. Rising has not marked it confirmed.",
      technical,
    };
  }
  if (lower.includes("revert") || lower.includes("execution reverted")) {
    return { message: "The transaction was reverted by the contract.", technical };
  }
  if (lower.includes("method") && (lower.includes("not") || lower.includes("unavailable") || lower.includes("missing"))) {
    return { message: "Live contract integration is not configured. This screen is currently in Demo Mode.", technical };
  }
  if (lower.includes("rpc") || lower.includes("failed to fetch") || lower.includes("network")) {
    return { message: "The configured network could not be reached.", technical };
  }
  return { message: "The action could not be completed.", technical };
}
