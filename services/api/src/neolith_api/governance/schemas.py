"""Pydantic schemas for the Governance Decision Runtime and Governance Profiles."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

GovernanceStyle = Literal["strict", "balanced", "high_autonomy", "custom"]
DecisionOutcome = Literal["allow", "review", "deny"]


class CustomProfileConfig(BaseModel):
    """Structured configuration for custom governance profiles."""

    model_config = ConfigDict(extra="ignore")

    max_action_amount: Decimal | None = None
    review_threshold: Decimal | None = None
    require_verified_beneficiary: bool = True
    require_review_operations: list[str] = Field(default_factory=list)
    category_thresholds: dict[str, Decimal] = Field(default_factory=dict)


class GovernanceProfileCreate(BaseModel):
    """Payload to create a new governance profile."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=3, max_length=128)
    style: GovernanceStyle
    description: str = Field(min_length=10, max_length=1000)
    configuration: dict[str, Any] = Field(default_factory=dict)


class GovernanceProfileUpdate(BaseModel):
    """Payload to update an existing governance profile."""

    model_config = ConfigDict(extra="forbid")

    description: str | None = Field(default=None, min_length=10, max_length=1000)
    configuration: dict[str, Any] | None = None


class GovernanceProfileRead(BaseModel):
    """Representation of a persisted governance profile."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    style: GovernanceStyle
    description: str
    version: str
    active: bool
    configuration: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class BudgetCheckSummary(BaseModel):
    """Authoritative budget check outcome attached to a decision."""

    category: str
    allocated_limit: Decimal
    current_spent: Decimal
    remaining_before: Decimal
    remaining_after: Decimal
    approval_threshold: Decimal | None = None
    is_feasible: bool
    exceeds_threshold: bool


class ActionEvaluationRequest(BaseModel):
    """Inbound request to evaluate a proposed financial or system action."""

    model_config = ConfigDict(extra="ignore")

    action_id: UUID | None = None
    trace_id: str = Field(min_length=8)
    task_id: UUID | None = None
    user_id: UUID | None = None
    agent_name: str = "financial-ai-agent"
    agent_version: str = "1.0.0"
    tool_name: str
    operation: str
    resource: str | None = None
    category: str | None = None
    amount: Decimal | None = None
    currency: str = "INR"
    parameters: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)


class GovernanceDecisionRead(BaseModel):
    """Complete structured governance decision envelope."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    action_id: UUID
    trace_id: str
    decision: DecisionOutcome
    outcome: DecisionOutcome | None = None
    reason_codes: list[str]
    risk_tier: str
    profile_id: UUID | None = None
    profile_name: str = "Balanced Control"
    profile_style: str = "balanced"
    profile_version: str = "1.0.0"
    budget_check: BudgetCheckSummary | None = None
    tool_metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    def model_post_init(self, __context: Any) -> None:
        if self.outcome is None:
            self.outcome = self.decision


class ExecutionRequestRead(BaseModel):
    """Representation of an execution request with its evaluated governance decision."""

    model_config = ConfigDict(from_attributes=True)

    action_id: UUID
    trace_id: str
    task_id: UUID
    user_id: UUID
    operation: str
    resource: str | None = None
    category: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)
    state: str
    requested_at: datetime
    created_at: datetime
    decision: GovernanceDecisionRead | None = None
