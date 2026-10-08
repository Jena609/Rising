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

`contracts/rising_water.py` is deployed on GenLayer Studio Next at `0x16091331A1eC3761Fa6A850f9F71eAf53755a8BD`. Do not point Rising at a Studionet or Bradbury address.

The deployed contract stores the participant and applies Rising Policy v1. Drought stage comes only from a scenario token in the submitted https URL (`normal`, `moderate`, `severe`, `emergency`, `conflict`, or `insufficient`). It does not fetch the page and it does not ask a model to multiply the entitlement. Validator consensus still applies to each write. A missing or conflicting token leaves the previous allocation unchanged.

The frontend must not invent that stage in Live Mode. It may show a local arithmetic check only after the contract returns a stage.
