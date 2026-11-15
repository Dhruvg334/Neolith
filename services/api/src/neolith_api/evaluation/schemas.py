"""Pydantic schemas for F15 Evaluation & Assurance Lab."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvaluationScenarioSummary(BaseModel):
    """Metadata summary of a canonical evaluation scenario."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    scenario_file: str
    expected_decision: str
    description: str


class EvaluationCaseResult(BaseModel):
    """Result of an individual evaluation scenario execution."""

    model_config = ConfigDict(extra="forbid")

    external_id: str
    title: str
    passed: bool
    latency_ms: int
    expected_decision: str
    actual_decision: str
    actual_reason_codes: list[str] = Field(default_factory=list)
    failure_reason: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class EvaluationRunResponse(BaseModel):
    """Comprehensive response for an executed evaluation run."""

    model_config = ConfigDict(extra="forbid")

    run_id: UUID
    suite_name: str
    state: str
    scenarios_total: int
    scenarios_passed: int
    scenarios_failed: int
    duration_ms: int
    results: list[EvaluationCaseResult]
    created_at: datetime
