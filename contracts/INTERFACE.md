# Rising contract interface

This file describes the methods Rising knows how to call. It is not a deployed contract, and it is not an ABI.

Rising calls a method only when that method name is present in the configured ABI or in a GenLayer contract schema read from the configured address. If the name is absent, the screen stays unavailable and no call is made.

Suggested methods:

```text
register_participant(basin_id, participant_type, participant_label, base_entitlement)
get_participant(wallet_address)
request_drought_evaluation(basin_id, evidence_urls)
get_current_allocation(wallet_address)
get_evaluation(evaluation_id)
challenge_evaluation(evaluation_id, alternative_evidence_url, reason)
```

Use the real deployed interface if the names or argument types differ. Put that ABI in `src/config/contract-abi.json` or in `NEXT_PUBLIC_GENLAYER_ABI`.

`contracts/rising_water.py` is deployed on GenLayer Studio Next at `0x8328a41d0f3D9a7aC2d1C5CD9439164128A645a9`. Do not point Rising at a Studionet or Bradbury address. The earlier URL-marker contract `0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD` is not the current deployment.

The contract stores the participant and applies Rising Policy v1. It fetches each https evidence page inside a GenLayer equivalence block. A fresh page must contain a `Rising-Evidence` record and a `Reservoir percent` line. The stage follows that percentage: above 70 is Normal, 40 through 70 is Moderate, 20 through below 40 is Severe, and below 20 is Emergency. A word in the URL is ignored. A page that cannot be fetched, or that has no Rising evidence record, leaves the previous allocation unchanged. Disagreeing fresh percentages leave it unchanged as well. The contract does not ask a model to multiply the entitlement. Validator consensus still applies to each write.

The frontend must not invent that stage in Live Mode. It may show a local arithmetic check only after the contract returns a stage.
