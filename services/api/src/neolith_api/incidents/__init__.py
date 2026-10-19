"""Security and governance incident timeline models (F13)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

IncidentSeverity = Literal["low", "medium", "high", "critical"]


class IncidentSchema(BaseModel):
    """Security or governance incident record."""

    id: UUID
    title: str
    severity: IncidentSeverity
    action_id: UUID | None = None
    agent_id: UUID | None = None
    containment_summary: str
    receipt_ids: list[UUID] = Field(default_factory=list)
    created_at: datetime
