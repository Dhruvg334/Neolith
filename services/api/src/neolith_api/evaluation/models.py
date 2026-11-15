"""SQLAlchemy 2.0 ORM models for F15 Evaluation & Assurance Lab."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from neolith_api.core.database import Base


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(UTC)


class EvaluationSuiteModel(Base):
    """Evaluation suite grouping related assurance scenarios."""

    __tablename__ = "evaluation_suites"
    __table_args__ = (UniqueConstraint("name", "version", name="uq_evaluation_suites_name_ver"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class EvaluationCaseModel(Base):
    """Individual scenario case within an evaluation suite."""

    __tablename__ = "evaluation_cases"
    __table_args__ = (
        UniqueConstraint("suite_id", "external_id", name="uq_evaluation_cases_suite_ext_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    suite_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("evaluation_suites.id"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scenario: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    expected: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)


class EvaluationRunModel(Base):
    """Execution record for an evaluation suite."""

    __tablename__ = "evaluation_runs"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    suite_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("evaluation_suites.id"), nullable=False
    )
    candidate_manifest: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    state: Mapped[str] = mapped_column(
        String(32), nullable=False, default="queued"
    )  # queued, running, completed, failed, cancelled
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class EvaluationResultModel(Base):
    """Result of an evaluation case within a run."""

    __tablename__ = "evaluation_results"
    __table_args__ = (UniqueConstraint("run_id", "case_id", name="uq_evaluation_results_run_case"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    run_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("evaluation_runs.id"), nullable=False
    )
    case_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("evaluation_cases.id"), nullable=False
    )
    actual: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_cost: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    trace_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
