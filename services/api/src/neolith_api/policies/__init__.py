"""Organisational policy and OPA decision models (F05)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from neolith_api.tools import RiskTier

PolicyVersionStatus = Literal[
    "draft",
    "validated",
    "approved",
    "active",
    "rolled_back",
    "retired",
]
DecisionOutcome = Literal["allow", "deny", "review", "allow_with_constraints"]


class PolicyVersionSchema(BaseModel):
    """Immutable Rego policy bundle version."""

    id: UUID
    policy_id: UUID
    version: str
    source_rego: str
    bundle_digest: str
    status: PolicyVersionStatus = "draft"
    created_by: UUID | None = None
    approved_by: UUID | None = None
    activated_at: datetime | None = None
    created_at: datetime


class OPADecisionResult(BaseModel):
    """Structured decision output from package neolith.decision."""

    decision: DecisionOutcome
    reason_codes: list[str] = Field(default_factory=list)
    required_approvals: list[str] = Field(default_factory=list)
    risk_tier: RiskTier = "R4"
