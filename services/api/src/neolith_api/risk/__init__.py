"""Deterministic and semantic risk signal models (F07)."""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RiskSignalSchema(BaseModel):
    """Risk classification signal attached to an execution request."""

    id: UUID
    action_id: UUID
    signal_type: str
    source: str
    score: Decimal | None = None
    confidence: Decimal | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
