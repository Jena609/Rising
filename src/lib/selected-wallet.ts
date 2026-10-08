export interface SelectedEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

/** In-memory only. Rising does not restore a wallet provider from storage. */
let active: SelectedEthereumProvider | null = null;

export function setActiveWalletProvider(provider: SelectedEthereumProvider | null): void {
  active = provider;
}

export function getActiveWalletProvider(): SelectedEthereumProvider | null {
  return active;
}
