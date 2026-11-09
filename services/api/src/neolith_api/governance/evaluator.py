"""Authoritative PolicyEvaluator protocol and OPA Rego HTTP client.

This module provides the single authoritative policy evaluation boundary for Neolith.
Policy logic lives strictly in OPA/Rego (package neolith.decision); this client performs
typed input serialization, remote evaluation, and fail-safe error handling without
duplicating policy rules in Python.
"""

from typing import Any, Literal, Protocol

import httpx
from pydantic import BaseModel, Field

DecisionOutcome = Literal["allow", "review", "deny"]


class PolicyEvaluationResult(BaseModel):
    """Structured decision returned by the authoritative policy engine."""

    decision: DecisionOutcome
    reason_codes: list[str] = Field(default_factory=list)
    required_approvals: list[str] = Field(default_factory=list)
    risk_tier: str = "R4"


class PolicyEvaluator(Protocol):
    """Protocol defining the authoritative policy evaluation boundary."""

    def evaluate(self, policy_input: dict[str, Any]) -> PolicyEvaluationResult:
        """Evaluate trusted server-side context against policy rules."""
        ...


class OpaPolicyEvaluator:
    """Production policy evaluator communicating with Open Policy Agent over HTTP."""

    def __init__(
        self,
        opa_url: str = "http://127.0.0.1:8181",
        decision_path: str = "/v1/data/neolith/decision/result",
        timeout_seconds: float = 2.0,
    ) -> None:
        self.opa_url = opa_url.rstrip("/")
        self.decision_path = decision_path if decision_path.startswith("/") else f"/{decision_path}"
        self.timeout_seconds = timeout_seconds

    @property
    def endpoint_url(self) -> str:
        return f"{self.opa_url}{self.decision_path}"

    def evaluate(self, policy_input: dict[str, Any]) -> PolicyEvaluationResult:
        """Post input payload to OPA and return validated PolicyEvaluationResult.

        If OPA is unreachable, times out, or returns an error, fails safely by returning
        a deterministic DENY outcome without falling back to duplicate Python logic.
        """
        payload = {"input": policy_input}
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                resp = client.post(
                    self.endpoint_url,
                    json=payload,
                    headers={"Content-Type": "application/json", "Accept": "application/json"},
                )
                resp.raise_for_status()
                data = resp.json()

            # OPA data document response structure: {"result": {"decision": "...", ...}}
            result_data = data.get("result")
            if not isinstance(result_data, dict):
                return PolicyEvaluationResult(
                    decision="deny",
                    reason_codes=["OPA_INVALID_RESPONSE"],
                    risk_tier=policy_input.get("tool", {}).get("risk_tier", "R4"),
                )

            decision_raw = str(result_data.get("decision", "deny")).lower()
            if decision_raw not in ("allow", "review", "deny"):
                decision_raw = "deny"

            raw_reasons = result_data.get("reason_codes", [])
            reason_codes = (
                [str(r) for r in raw_reasons] if isinstance(raw_reasons, list) else ["DEFAULT_DENY"]
            )

            raw_approvals = result_data.get("required_approvals", [])
            required_approvals = (
                [str(a) for a in raw_approvals] if isinstance(raw_approvals, list) else []
            )

            risk_tier = str(
                result_data.get("risk_tier", policy_input.get("tool", {}).get("risk_tier", "R4"))
            )

            return PolicyEvaluationResult(
                decision=decision_raw,  # type: ignore[arg-type]
                reason_codes=sorted(reason_codes),
                required_approvals=required_approvals,
                risk_tier=risk_tier,
            )

        except Exception:
            # Deterministic fail-safe deny on any communication or parser failure
            return PolicyEvaluationResult(
                decision="deny",
                reason_codes=["OPA_SERVICE_UNAVAILABLE"],
                required_approvals=[],
                risk_tier=policy_input.get("tool", {}).get("risk_tier", "R4"),
            )


class FakePolicyEvaluator:
    """Test policy evaluator returning predetermined structured responses without Python logic."""

    def __init__(
        self,
        default_result: PolicyEvaluationResult | None = None,
        scenario_map: dict[str, PolicyEvaluationResult] | None = None,
    ) -> None:
        self.default_result = default_result or PolicyEvaluationResult(
            decision="allow",
            reason_codes=["BASE_POLICY_ALLOW"],
            risk_tier="R2",
        )
        self.scenario_map = scenario_map or {}

    def evaluate(self, policy_input: dict[str, Any]) -> PolicyEvaluationResult:
        # Match by action operation or resource or category if mapped
        action = policy_input.get("action", {})
        resource = action.get("resource") or policy_input.get("resource") or ""
        operation = action.get("operation") or ""
        category = action.get("category") or ""
        amount = str(action.get("amount") or "")

        for key, res in self.scenario_map.items():
            if key in (resource, operation, category, amount):
                return res

        return self.default_result
