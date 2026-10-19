"""Task and structured Plan models (F01, F02)."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

TaskState = Literal[
    "draft",
    "understanding",
    "needs_clarification",
    "researching",
    "planning",
    "awaiting_governance",
    "awaiting_approval",
    "ready_to_execute",
    "executing",
    "completed",
    "failed",
    "cancelled",
    "denied",
    "execution_pending_reconciliation",
]


class TaskSchema(BaseModel):
    """User task record aligned with specs/schemas/task.schema.json."""

    task_id: UUID
    user_id: UUID
    request: str = Field(min_length=1)
    objective: str | None = None
    constraints: dict[str, Any] = Field(default_factory=dict)
    state: TaskState = "draft"
    trace_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class PlanSchema(BaseModel):
    """Structured agent plan version."""

    id: UUID
    task_id: UUID
    version: int = Field(ge=1)
    objective: str
    steps: list[dict[str, Any]]
    evidence_ids: list[str] = Field(default_factory=list)
    created_at: datetime
