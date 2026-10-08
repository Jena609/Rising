export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-navy">
      <span className="spinner inline-block h-4 w-4 animate-spin rounded-full border-2 border-water border-r-transparent" />
      <span>{label}</span>
    </div>
  );
}
