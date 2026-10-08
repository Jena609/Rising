# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

"""
Rising Policy v1 for the fictional Green Valley Basin.

This contract stores a testnet participant and applies the published multipliers.
It does not create a legal water right. Drought stage is derived only from the
scenario token in the submitted Rising demo evidence URLs. It does not fetch a
government gauge and it does not ask a model to multiply the entitlement.
"""

import genlayer as gl
from genlayer.types import *
import json


def _multiplier(stage: str, participant_type: str) -> int:
    if participant_type == "household":
        return 10000
    if stage == "NORMAL":
        return 10000
    if stage == "MODERATE":
        return 8000 if participant_type == "farm" else 6000
    if stage == "SEVERE":
        return 5000 if participant_type == "farm" else 2500
    if stage == "EMERGENCY":
        return 2500 if participant_type == "farm" else 1000
    raise gl.vm.UserError("Unknown drought stage or participant type")


def _allocation(base: int, stage: str, participant_type: str) -> int:
    product = base * _multiplier(stage, participant_type)
    return (product + 5000) // 10000


def _scenario_token(url: str) -> str:
    lowered = url.lower()
    for token in ("insufficient", "conflict", "emergency", "severe", "moderate", "normal"):
        if token in lowered:
            return token
    return ""


def _wallet_key(value) -> str:
    # Callers may pass a string or an Address. Address has no lower().
    return str(value).strip().lower()


class RisingWater(gl.contract.Contract):
    policy_version: str
    participants: gl.storage.TreeMap[str, str]
    allocations: gl.storage.TreeMap[str, str]
    evaluations: gl.storage.TreeMap[str, str]
    challenges: gl.storage.TreeMap[str, str]
    evaluation_count: u32

    def __init__(self):
        self.policy_version = "Rising Policy v1"
        self.evaluation_count = 0

    @gl.public.write
    def register_participant(
        self,
        basin_id: str,
        participant_type: str,
        participant_label: str,
        base_entitlement: int,
    ) -> None:
        if basin_id != "green-valley":
            raise gl.vm.UserError("Only the fictional Green Valley Basin is accepted")
        if participant_type not in ("household", "farm", "industrial"):
            raise gl.vm.UserError("Participant type must be household, farm, or industrial")
        label = participant_label.strip()
        if len(label) < 2 or len(label) > 40:
            raise gl.vm.UserError("Participant label must be 2 to 40 characters")
        if base_entitlement <= 0 or base_entitlement > 1000000000:
            raise gl.vm.UserError("Base entitlement must be a positive whole number of water units")
        wallet = _wallet_key(gl.message.sender_address)
        self.participants[wallet] = json.dumps(
            {
                "basin_id": basin_id,
                "participant_type": participant_type,
                "participant_label": label,
                "base_entitlement": int(base_entitlement),
            }
        )

    @gl.public.view
    def get_participant(self, wallet_address: str) -> dict:
        raw = self.participants.get(_wallet_key(wallet_address))
        if raw is None:
            return {}
        return json.loads(raw)

    @gl.public.write
    def request_drought_evaluation(self, basin_id: str, evidence_urls: list) -> str:
        if basin_id != "green-valley":
            raise gl.vm.UserError("Only the fictional Green Valley Basin is accepted")
        wallet = _wallet_key(gl.message.sender_address)
        participant_raw = self.participants.get(wallet)
        if participant_raw is None:
            raise gl.vm.UserError("Register a fictional water entitlement first")
        participant = json.loads(participant_raw)
        if not isinstance(evidence_urls, list) or len(evidence_urls) == 0:
            raise gl.vm.UserError("At least one evidence URL is required")

        tokens = []
        for url in evidence_urls:
            if not isinstance(url, str) or not url.startswith("https://"):
                raise gl.vm.UserError("Each evidence URL must start with https://")
            token = _scenario_token(url)
            if token:
                tokens.append(token)

        previous_raw = self.allocations.get(wallet)
        previous_allocation = json.loads(previous_raw)["allocation"] if previous_raw else None
        distinct = sorted(set(tokens))
        status = "Inconclusive"
        stage = ""
        reservoir = None
        allocation = previous_allocation
        applied = False

        if len(distinct) == 0 or "insufficient" in distinct:
            message = "Insufficient current evidence. The previous allocation remains active."
        elif "conflict" in distinct or len(distinct) > 1:
            status = "Disputed"
            message = "Evidence sources conflict. Existing allocations remain active until review is complete."
        else:
            token = distinct[0]
            stage = {
                "normal": "NORMAL",
                "moderate": "MODERATE",
                "severe": "SEVERE",
                "emergency": "EMERGENCY",
            }[token]
            reservoir = {"normal": 80, "moderate": 58, "severe": 30, "emergency": 15}[token]
            allocation = _allocation(
                int(participant["base_entitlement"]),
                stage,
                participant["participant_type"],
            )
            applied = True
            status = "Finalized"
            message = "Allocation calculated from the contract drought stage and Rising Policy v1."

        self.evaluation_count = int(self.evaluation_count) + 1
        evaluation_id = f"eval-{int(self.evaluation_count)}"
        record = {
            "evaluation_id": evaluation_id,
            "wallet_address": wallet,
            "basin_id": basin_id,
            "status": status,
            "drought_stage": stage,
            "reservoir_percent": reservoir,
            "allocation": allocation,
            "previous_allocation": previous_allocation,
            "evidence_urls": evidence_urls,
            "policy_version": self.policy_version,
            "applied": applied,
            "message": message,
        }
        self.evaluations[evaluation_id] = json.dumps(record)
        if applied:
            self.allocations[wallet] = json.dumps(
                {
                    "drought_stage": stage,
                    "allocation": allocation,
                    "reservoir_percent": reservoir,
                    "status": status,
                    "policy_version": self.policy_version,
                    "evaluation_id": evaluation_id,
                }
            )
        return evaluation_id

    @gl.public.view
    def get_current_allocation(self, wallet_address: str) -> dict:
        raw = self.allocations.get(_wallet_key(wallet_address))
        if raw is None:
            return {}
        return json.loads(raw)

    @gl.public.view
    def get_evaluation(self, evaluation_id: str) -> dict:
        raw = self.evaluations.get(evaluation_id)
        if raw is None:
            return {}
        return json.loads(raw)

    @gl.public.write
    def challenge_evaluation(
        self,
        evaluation_id: str,
        alternative_evidence_url: str,
        reason: str,
    ) -> str:
        if self.evaluations.get(evaluation_id) is None:
            raise gl.vm.UserError("Evaluation not found")
        if not alternative_evidence_url.startswith("https://"):
            raise gl.vm.UserError("Alternative evidence URL must start with https://")
        if len(reason.strip()) < 12:
            raise gl.vm.UserError("Describe the challenge")
        wallet = _wallet_key(gl.message.sender_address)
        challenge_id = f"chg-{evaluation_id}-{wallet[-6:]}"
        self.challenges[challenge_id] = json.dumps(
            {
                "evaluation_id": evaluation_id,
                "alternative_evidence_url": alternative_evidence_url,
                "reason": reason.strip(),
                "wallet_address": wallet,
                "status": "Submitted",
            }
        )
        return challenge_id
