"""Assurance Lab evaluation suite, case, run, and result models (F15)."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel

EvaluationRunState = Literal["queued", "running", "completed", "failed", "cancelled"]


class EvaluationRunSchema(BaseModel):
    """Reproducible evaluation run record."""

    id: UUID
    suite_id: UUID
    candidate_manifest: dict[str, Any]
    state: EvaluationRunState = "queued"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime


class EvaluationResultSchema(BaseModel):
    """Outcome of a single evaluation scenario case."""

    id: UUID
    run_id: UUID
    case_id: UUID
    actual: dict[str, Any]
    passed: bool
    latency_ms: int | None = None
    model_cost: Decimal | None = None
    trace_id: str | None = None
    failure_reason: str | None = None
