"""Protected enterprise tool execution models (F10)."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel

ToolExecutionState = Literal[
    "requested",
    "executing",
    "succeeded",
    "failed",
    "unknown",
    "compensated",
]


class ToolExecutionSchema(BaseModel):
    """Protected enterprise service execution record."""

    id: UUID
    action_id: UUID
    permit_id: UUID
    idempotency_key: str
    state: ToolExecutionState
    result: dict[str, Any] | None = None
    result_hash: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
