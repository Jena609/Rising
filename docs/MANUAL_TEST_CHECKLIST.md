# Rising manual test checklist

Automated tests cover policy arithmetic, evidence conflicts, configuration gates, form validation, and demo records. The checks below need a browser and, for Live Mode, a configured GenLayer testnet.

## Wallet

- Connect Wallet opens the injected wallet and shows a shortened address.
- Selecting the address shows or copies the full address.
- Disconnect clears the Rising session display.
- A rejected connection shows "Your wallet rejected the connection."
- Chain ID 61997 shows Correct Network and GenLayer Studio Next.
- Chain ID 4221 shows: "You are connected to Bradbury. Rising requires GenLayer Studio Next on chain ID 61997."
- Chain ID 61999 shows: "You are connected to Studionet. Rising requires GenLayer Studio Next on chain ID 61997."
- Chain ID 61127 shows: "You are connected to Localnet. Rising requires GenLayer Studio Next on chain ID 61997."
- Any other chain shows: "Unsupported network. Please switch to GenLayer Studio Next."
- Switch to Studio Next is available. Rejecting it does not change the network.
- Rejecting the switch shows an error and does not change the network.
- The address and GEN balance match the wallet and the configured RPC.

## Faucet

- Get Studio Next Test GEN opens https://studio-dev.genlayer.com in a new tab.
- With no faucet URL, Rising shows "The official Studio Next faucet URL has not been configured yet. Open GenLayer Studio Next and use its official faucet."
- Refresh Balance reads the configured RPC.
- Rising does not say test GEN was received unless that read shows a balance.

## Registration

- An empty form, a missing type, a zero or negative entitlement, and a missing acknowledgment all fail.
- A second click while a submission is in progress does not send another transaction.
- Demo Mode completes with "Simulation only" and no transaction hash.
- Live Mode opens the wallet and waits for approval.

## Transactions

- A rejected transaction shows "Your wallet rejected the transaction." and not a success state.
- A reverted or failed transaction shows an error and Try Again on the page error view, or the failed transaction card.
- Pending actions disable the submit button.
- A confirmed live transaction shows the hash returned by the wallet.
- An explorer link appears only when a transaction URL template is configured. Otherwise the hash and the explorer home are shown.

## Evaluation

- Normal, Moderate, Severe, and Emergency demo scenarios show the matching stage and multiplier.
- Conflicting sources show Disputed and do not change the allocation.
- Missing or stale sources keep the previous allocation.
- The final water-unit amount matches base entitlement times the multiplier.
- Live Mode does not show Finalized until the GenLayer receipt says the transaction is finalized and execution succeeded.

## Challenge

- An invalid URL and an empty reason fail validation.
- A demo challenge is labeled Demo Challenge and has no hash.
- A live challenge asks for wallet approval.
- The allocation is unchanged immediately after the challenge.

## Configuration

- A missing contract address, RPC URL, or ABI keeps Demo Mode.
- An invalid chain ID shows an error and keeps Demo Mode.
- Live Mode stays off until the readiness list is complete.
