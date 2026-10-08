import { risingConfig } from "@/lib/config";
import { explorerTransactionUrl, isTransactionHash, safeHttpUrl } from "@/lib/urls";

export function ExplorerLink({ hash }: { hash?: string }) {
  if (!isTransactionHash(hash)) return <p className="text-sm text-muted">No transaction hash is available.</p>;
  const direct = explorerTransactionUrl(risingConfig.blockExplorerUrl, hash, risingConfig.explorerTxUrlTemplate);
  const home = safeHttpUrl(risingConfig.blockExplorerUrl);
  return (
    <div className="text-sm">
      <p className="break-all font-mono text-xs text-navy">Hash: {hash}</p>
      {direct ? (
        <a className="mt-1 inline-block font-semibold text-water" href={direct} target="_blank" rel="noreferrer">
          View in explorer
        </a>
      ) : home ? (
        <p className="mt-1">
          A direct transaction link is not configured.{" "}
          <a className="font-semibold text-water" href={home} target="_blank" rel="noreferrer">
            Open explorer
          </a>{" "}
          and search for the hash.
        </p>
      ) : (
        <p className="mt-1 text-muted">The block explorer URL has not been configured yet.</p>
      )}
    </div>
  );
}
