"""Structured workflow state for the primary procurement planning agent (F02)."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

WorkflowNode = Literal[
    "understand_goal",
    "clarify_constraints",
    "retrieve_candidates",
    "compare_candidates",
    "build_plan",
    "propose_action",
    "await_governance",
]


class ActionProposal(BaseModel):
    """Structured action proposal emitted by the agent (never direct execution)."""

    purpose: str
    tool: str
    operation: str
    parameters: dict[str, Any]
    amount: str | None = None
    currency: str | None = None
    evidence_ids: list[str] = Field(default_factory=list)
    expected_governance_checks: list[str] = Field(
        default_factory=lambda: ["permission", "policy", "budget", "risk"]
    )


class AgentWorkflowState(BaseModel):
    """Serializable checkpoint state for a Neolith primary agent task run."""

    task_id: UUID
    user_id: UUID
    trace_id: str
    raw_request: str
    extracted_objective: str | None = None
    constraints: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    candidate_ids: list[str] = Field(default_factory=list)
    recommended_vendor_id: str | None = None
    proposal: ActionProposal | None = None
    current_node: WorkflowNode = "understand_goal"
    tainted_context_detected: bool = False
