"""Runtime Gateway Execution Request Envelope models (F03)."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

ActionState = Literal[
    "received",
    "validating",
    "denied",
    "awaiting_approval",
    "permitted",
    "executing",
    "succeeded",
    "failed",
    "unknown",
    "compensated",
]


class ExecutionRequestEnvelopeSchema(BaseModel):
    """Canonical Execution Request Envelope matching specs/schemas/execution-request.schema.json."""

    action_id: UUID
    trace_id: str = Field(min_length=8)
    task_id: UUID
    user_id: UUID
    agent_id: UUID
    agent_version: str = Field(min_length=1)
    delegation_id: UUID | None = None
    tool_id: UUID
    tool_version: str | None = None
    operation: str = Field(min_length=1)
    resource: str | None = None
    category: str | None = None
    amount: str | None = Field(default=None, pattern=r"^[0-9]+(\.[0-9]{1,2})?$")
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    parameters: dict[str, Any]
    parameters_hash: str = Field(pattern=r"^sha256:[a-f0-9]{64}$")
    context: dict[str, Any] = Field(default_factory=dict)
    context_hash: str = Field(pattern=r"^sha256:[a-f0-9]{64}$")
    requested_at: datetime
    nonce: str = Field(min_length=16)
