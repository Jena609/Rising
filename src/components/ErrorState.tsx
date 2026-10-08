export function ErrorState({ message, technical }: { message: string; technical?: string | null }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
      <p className="font-semibold">Something needs attention</p>
      <p className="mt-1">{message}</p>
      {technical ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">Technical details</summary>
          <p className="mt-1 break-words font-mono text-xs">{technical}</p>
        </details>
      ) : null}
    </div>
  );
}
