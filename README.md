# Rising Water Allocation

Transparent water allocation for a changing climate.

Rising is a GenLayer Studio Next testnet experiment for a fictional drought-allocation policy. People can connect a wallet, register a fictional water entitlement, submit public evidence pages, and challenge a result.

Green Valley Basin is fictional. A registration does not create a legal water right, a government decision, or a financial product. Test GEN pays testnet fees only. Rising does not verify government water data, and it does not manage real funds.

The Intelligent Contract fetches each submitted https page and reads a `Reservoir percent` line from a `Rising-Evidence` record. The drought stage follows that percentage. A word in the URL is not evidence. If a page cannot be fetched, has no Rising evidence record, or disagrees with another fresh reading, the previous allocation stays in place.

## Reviewer quick start

1. Open https://rising-kira-68d0.vercel.app.
2. Choose Enter Rising.
3. Use Demo Mode with no wallet, or connect a wallet on Studio Next, chain ID `61997`.
4. Register a fictional participant at `/register`.
5. Open `/evaluation` and submit one of the evidence sets below.
6. Open `/history` and `/challenge`. A challenge stores the fetched reading and does not change the allocation.
7. Confirm the contract record in the Studio Next explorer. Demo Mode never shows a transaction hash.

Example evidence pages:

- Agreeing moderate gauges: https://rising-kira-68d0.vercel.app/evidence/r58-a.txt and https://rising-kira-68d0.vercel.app/evidence/r58-b.txt
- Disagreeing gauges: https://rising-kira-68d0.vercel.app/evidence/r58-c.txt and https://rising-kira-68d0.vercel.app/evidence/r30-c.txt
- A URL such as `https://example.com/evidence/severe-drought` has no Rising evidence record, so it does not become a severe stage.

Studio Next test GEN comes from the account selector at https://studio-dev.genlayer.com. Rising has no separate faucet, and it does not hold a private key.

## Known limitations

- The basin, gauges, and entitlements are fictional.
- The contract does not accept a page just because its URL contains a word such as `severe`.
- It does not crawl arbitrary drought websites or ask a model to calculate the allocation.
- A challenge does not change the current allocation.
- The earlier contract at `0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD` used the URL word. Those transactions remain on that address. They are not the current evidence model.

## Live

Studio Next only. No real value. The address below is the earlier URL-marker deployment. The replacement address is recorded here after its fetched-page transactions are confirmed.

- Repo: [github.com/Jena609/Rising](https://github.com/Jena609/Rising)
- Chain: Studio Next `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Explorer: [explorer-studio-dev.genlayer.com](https://explorer-studio-dev.genlayer.com/)
- Current contract: [`0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`](https://explorer-studio-dev.genlayer.com/address/0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD)
- Deploy tx: [`0x5c51bae4a1d349da2e7387137191d1d1b0805dc6b7477c802db51e3c6eff23a6`](https://explorer-studio-dev.genlayer.com/tx/0x5c51bae4a1d349da2e7387137191d1d1b0805dc6b7477c802db51e3c6eff23a6)
- Source file SHA-256 (`contracts/rising_water.py`): `9cd64a0f1f38958f61948582a078acb4997ebf7626e14e4ad7e1d7ddb965c3a8`
- Runner pin: `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`

Public configuration for this deployment:

```bash
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio-dev.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61997
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio-dev.genlayer.com
NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED=true
```

The account `0x5F85c75F8442b92ba66C30371CEf6cF3D7B4c650` is registered as North Orchard, a farm in Green Valley, with a base entitlement of 1,000. The current allocation is eval-7: Moderate drought, reservoir 58%, 800 water units, Rising Policy v1. Every transaction below is FINALIZED on the Studio Next explorer.

| Record | Result | Transaction |
| --- | --- | --- |
| Deploy | Rising contract | [`0x5c51bae4a1d349da2e7387137191d1d1b0805dc6b7477c802db51e3c6eff23a6`](https://explorer-studio-dev.genlayer.com/tx/0x5c51bae4a1d349da2e7387137191d1d1b0805dc6b7477c802db51e3c6eff23a6) |
| Registration | North Orchard, farm, base 1,000 | [`0xeed36dc0defa0f1a09df677b73eb8ed74ec4e61aadc59452e0ed704f74e1891c`](https://explorer-studio-dev.genlayer.com/tx/0xeed36dc0defa0f1a09df677b73eb8ed74ec4e61aadc59452e0ed704f74e1891c) |
| eval-1 | Moderate, reservoir 58%, allocation 800 | [`0x2ea7b973c3002df0ece26e3345b27d7d643ae97931e0cf429ea0f39a828d83b8`](https://explorer-studio-dev.genlayer.com/tx/0x2ea7b973c3002df0ece26e3345b27d7d643ae97931e0cf429ea0f39a828d83b8) |
| eval-2 | Normal, reservoir 80%, allocation 1,000 | [`0x0098f5a1f9d7af0909e8a5103246a1b70d209f816c56b6e1c710176593bb2794`](https://explorer-studio-dev.genlayer.com/tx/0x0098f5a1f9d7af0909e8a5103246a1b70d209f816c56b6e1c710176593bb2794) |
| eval-3 | Severe, reservoir 30%, allocation 500 | [`0x47da8e8e902853a9ac526be758ee1f5feeb0b1d208a891b215e095a04a30d94f`](https://explorer-studio-dev.genlayer.com/tx/0x47da8e8e902853a9ac526be758ee1f5feeb0b1d208a891b215e095a04a30d94f) |
| eval-4 | Emergency, reservoir 15%, allocation 250 | [`0x0a91456281d04f3dcfc82ed1f48142516aab521fa579ad0397a3c69c27ac313e`](https://explorer-studio-dev.genlayer.com/tx/0x0a91456281d04f3dcfc82ed1f48142516aab521fa579ad0397a3c69c27ac313e) |
| eval-5 | Disputed. Allocation stayed 250 | [`0x6f0c97158a1770b4b1db64eb1f76ff2ec827801b9fd2812d13a197fb62a78fb9`](https://explorer-studio-dev.genlayer.com/tx/0x6f0c97158a1770b4b1db64eb1f76ff2ec827801b9fd2812d13a197fb62a78fb9) |
| eval-6 | Inconclusive. Allocation stayed 250 | [`0x0fde54eceabf2eafa429ed40160d982daa916bc1a42df86137a86f19c9061aa1`](https://explorer-studio-dev.genlayer.com/tx/0x0fde54eceabf2eafa429ed40160d982daa916bc1a42df86137a86f19c9061aa1) |
| Challenge | eval-1, first submission | [`0x2e436e7600cf60700a29c80c2a70687a97f26a6cef7b49952f5b263e6dbb76b3`](https://explorer-studio-dev.genlayer.com/tx/0x2e436e7600cf60700a29c80c2a70687a97f26a6cef7b49952f5b263e6dbb76b3) |
| Challenge | eval-1, second submission | [`0x9a78ce05599e82efa84349b9a280b3b51dbea172b27f98f5358fec42c4865d3a`](https://explorer-studio-dev.genlayer.com/tx/0x9a78ce05599e82efa84349b9a280b3b51dbea172b27f98f5358fec42c4865d3a) |
| Registration | North Orchard written again, base 1,000 | [`0xcd05b921f055976e2f8d090f1ab517cc68888854ddb329e740e2852360cd270e`](https://explorer-studio-dev.genlayer.com/tx/0xcd05b921f055976e2f8d090f1ab517cc68888854ddb329e740e2852360cd270e) |
| eval-7 | Moderate, reservoir 58%, allocation 800 | [`0xc7af67c4077bffe0657213615cd5ed4b9736acb4c8e61d11aaf93179d144fe3e`](https://explorer-studio-dev.genlayer.com/tx/0xc7af67c4077bffe0657213615cd5ed4b9736acb4c8e61d11aaf93179d144fe3e) |
| Challenge | eval-1, stored challenge `chg-eval-1-b4c650` | [`0x7232baf73cf007124718c5a00485e86f160ad16beda0d1e6427d7e753521aaee`](https://explorer-studio-dev.genlayer.com/tx/0x7232baf73cf007124718c5a00485e86f160ad16beda0d1e6427d7e753521aaee) |

## Install

```bash
cd C:\Users\prade\rising
npm install
```

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run typecheck
npm run build
npm start
```

## Demo Mode

Demo Mode is the default. It needs no wallet and no GenLayer configuration.

You can open every page, preview four drought scenarios plus conflict and insufficient-evidence cases, register a fictional entitlement, preview an evaluation, and store a challenge in this browser.

Every simulated step is labeled **Simulation only**. Demo Mode does not create a transaction hash, does not say "on-chain confirmed", does not say validators processed the result, and does not say test GEN was received.

The banner reads: "Demo Mode — Studio Next contract integration is not configured, so blockchain transactions are disabled."

Clear the browser session from the registration or configuration page. That button only removes local browser data.

## Wallet

Use an injected EVM wallet such as MetaMask or Rabby. Rising asks the wallet to connect. It never asks for a seed phrase or private key, and it never signs unless you approve the wallet prompt.

Rising does not switch the network by itself. Use **Switch to Studio Next**. The only expected chain ID is 61997. Rejecting that prompt leaves the wallet on its current network. Bradbury (4221), Studionet (61999), and Localnet (61127) are rejected.

## GenLayer network

Copy `.env.example` to `.env.local`. Set only values from the official GenLayer network you are using. Do not invent them.

```bash
NEXT_PUBLIC_GENLAYER_NETWORK_NAME
NEXT_PUBLIC_GENLAYER_RPC_URL
NEXT_PUBLIC_GENLAYER_CHAIN_ID
NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_NAME
NEXT_PUBLIC_GENLAYER_NATIVE_CURRENCY_SYMBOL
NEXT_PUBLIC_GENLAYER_NATIVE_DECIMALS
```

`NEXT_PUBLIC_GENLAYER_NATIVE_DECIMALS` defaults to 18 because the installed `genlayer-js` formats GEN with 18 decimal places. Change it if your network uses a different value.

Restart `npm run dev` after changing public environment variables. Next.js reads them at build and dev start.

## Faucet

```bash
NEXT_PUBLIC_GENLAYER_FAUCET_URL
```

**Get Studio Next Test GEN** opens https://studio-dev.genlayer.com in a new tab. That is the official Studio Next web app. GenLayer does not publish a separate faucet URL for this network. The faucet is the account-selector button inside that app. Rising does not request tokens itself. Come back and use **Refresh Balance**. The balance is read from https://studio-dev.genlayer.com/api. A faucet visit is not shown as a received payment unless that read shows a balance.

The app says: "The official Studio Next faucet URL has not been configured yet. Open GenLayer Studio Next and use its official faucet."

## Explorer

```bash
NEXT_PUBLIC_GENLAYER_EXPLORER_URL
NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE
```

The template is optional and must contain `{hash}`. The Studio Next explorer serves each transaction at:

```bash
NEXT_PUBLIC_GENLAYER_EXPLORER_TX_URL_TEMPLATE=https://explorer-studio-dev.genlayer.com/tx/{hash}
```

Without a template, Rising shows the real hash and a link to the explorer home. It does not invent a path on any other host.

## Contract address, ABI, and GenLayer client

```bash
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS
NEXT_PUBLIC_GENLAYER_ABI
NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED
```

You can also put the ABI array in `src/config/contract-abi.json`. The file ships as `[]`.

`NEXT_PUBLIC_GENLAYER_INTEGRATION_ENABLED=true` turns on `genlayer-js` 1.1.8 for reads, writes, schema checks, and transaction status. Rising still calls a method only when that method is in the ABI or in the schema returned by the configured contract.

This app tracks receipts with `genlayer-js` (`getTransaction` and the SDK status names). It does not bundle `@genlayer/transaction-kit`, because that package is a separate prerelease. Where the RPC does not return a GenLayer status, the screen says: "Detailed GenLayer status is unavailable from the current integration."

Supported method names, when the configured interface actually contains them:

- `register_participant`
- `get_participant`
- `request_drought_evaluation`
- `get_current_allocation`
- `get_evaluation`
- `challenge_evaluation`

See `contracts/INTERFACE.md`. The Studio Next contract is [`0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`](https://explorer-studio-dev.genlayer.com/address/0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD). The old Studionet deployment is not used.

## Switch from Demo Mode to Live Mode

Live Mode starts only when all of these are valid:

- Canonical Studio-dev RPC URL
- Chain ID 61997
- Explorer URL
- Contract address on Studio Next
- ABI with at least one function, or GenLayer integration enabled
- No public secret such as `NEXT_PUBLIC_PRIVATE_KEY`

A dedicated faucet URL is not required, because GenLayer does not publish one for Studio Next. A connected wallet on chain 61997 and a non-zero test GEN balance are also required before a live button will submit.

The configuration page shows the checklist.

## Test registration

Demo: open Register, enter a label such as `Farm 004`, a base entitlement such as `1000`, check the acknowledgment, and confirm the preview. The result is stored in the browser and has no hash.

Live: connect, switch network, refresh a non-zero test GEN balance, submit, and approve the wallet. Rising shows the hash only after the wallet returns one, and shows the participant as a contract record only after `get_participant` can be read.

## Test a drought evaluation

Demo: on Basin, choose a scenario, then request an evaluation. Normal, Moderate, Severe, and Emergency follow the reservoir bands. Conflict and insufficient evidence keep the previous allocation.

Live: the form submits the evidence URLs. The drought stage and final allocation are shown only when the contract read returns them. Wallet approval is not treated as consensus, and `Finalized` is shown only when the GenLayer status is finalized and execution succeeded.

## Test a challenge

Submit an evaluation ID, an https evidence URL, and a reason. Demo Mode stores a **Demo Challenge** locally. Live Mode asks the wallet to sign `challenge_evaluation` when that method is configured. Neither path changes the allocation immediately.

## What Rising does not do

- It does not create legal water rights.
- It does not custody assets or accept real money.
- It does not ask for or store a seed phrase or private key.
- It does not sign without an explicit wallet approval.
- It does not invent RPC URLs, chain IDs, faucet URLs, explorer URLs, contract addresses, ABIs, hashes, validator results, or faucet payments.
- It does not claim that validator consensus proves a physical water measurement.

## Deployment

Build with the public variables present in the environment, then start the Node server:

```bash
npm run build
npm start
```

Any host that runs a Next.js Node server can serve the app. Public variables are visible in the browser. Never put a private key in them.

## Configured network

The network is fixed to GenLayer Studio Next. The configured contract is:

- Network name: `GenLayer Studio Next`
- Canonical network name: `studio-dev`
- RPC URL: `https://studio-dev.genlayer.com/api`
- Chain ID: `61997`
- Native currency: `GEN`
- Explorer URL: `https://explorer-studio-dev.genlayer.com`
- Faucet URL: not published. Use the faucet inside https://studio-dev.genlayer.com
- Contract address: `0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`
- Deployment mode with that address configured: `live`

## Current network

This version uses GenLayer Studio Next only. Values are the official ones published on the GenLayer networks page for the Studio development preview:

- Network: GenLayer Studio Next
- Canonical name: `studio-dev`
- RPC: `https://studio-dev.genlayer.com/api`
- Chain ID: `61997`
- Explorer: `https://explorer-studio-dev.genlayer.com`
- Studio web app: `https://studio-dev.genlayer.com`
- Faucet: built into the Studio account selector. No separate faucet URL is published.
- Contract address: `0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`

Chain ID 4221 is Bradbury, 61999 is Studionet, and 61127 is Localnet. A wallet on those chains is told to switch to 61997. With `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` set to the Studio Next contract above, deployment mode is live. A blank address stays in Demo Mode and the app shows: "Rising is connected to GenLayer Studio Next, but the Rising Intelligent Contract has not been configured."

A transaction on this deployment is `https://explorer-studio-dev.genlayer.com/tx/{hash}`. The contract page is `https://explorer-studio-dev.genlayer.com/address/0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`. Rising uses that path only when the transaction template is set to the Studio Next explorer. It does not invent a path on any other host.

Installed `genlayer-js` 1.1.8 has no `studioDevnet` chain. Rising builds a client chain with ID 61997, `isStudio: true`, and the canonical RPC. The on-chain deploy and writes were sent with GenLayer CLI 0.40.0-rc.3. The website client does not copy a consensus contract into that chain.
