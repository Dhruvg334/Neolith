"""SQLAlchemy 2.0 ORM models for the Governance Decision Runtime and Governance Profiles."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from neolith_api.core.database import Base


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(UTC)


class GovernanceProfileModel(Base):
    """Configurable enterprise governance profile and policy style."""

    __tablename__ = "governance_profiles"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    style: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # strict, balanced, high_autonomy, custom
    description: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    configuration: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class PermissionBindingModel(Base):
    """Explicit capability assignment to user, role, or agent."""

    __tablename__ = "permission_bindings"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    subject_type: Mapped[str] = mapped_column(String(32), nullable=False)  # user, role, agent
    subject_id: Mapped[str] = mapped_column(String(128), nullable=False)
    capability: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_scope: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    effect: Mapped[str] = mapped_column(String(16), nullable=False, default="allow")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class ExecutionRequestModel(Base):
    """Canonical execution request submitted for governance evaluation."""

    __tablename__ = "execution_requests"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    trace_id: Mapped[str] = mapped_column(String(128), nullable=False)
    task_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    agent_version_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("agent_versions.id"), nullable=False
    )
    tool_version_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tool_versions.id"), nullable=False
    )
    operation: Mapped[str] = mapped_column(String(128), nullable=False)
    resource: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    parameters_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    context_payload: Mapped[dict[str, Any]] = mapped_column(
        "context", JSON, nullable=False, default=dict
    )
    context_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    nonce: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="received")
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class GovernanceDecisionModel(Base):
    """Persisted governance evaluation outcome with reason codes and trace correlation."""

    __tablename__ = "governance_decisions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    action_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("execution_requests.id"), unique=True, nullable=False
    )
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)  # allow, review, deny
    permission_result: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    risk_tier: Mapped[str] = mapped_column(String(8), nullable=False, default="R2")
    policy_version_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    policy_bundle_digest: Mapped[str | None] = mapped_column(String(128), nullable=True)
    profile_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("governance_profiles.id"), nullable=True
    )
    profile_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    budget_check: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    tool_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    opa_decision_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    input_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class RiskSignalModel(Base):
    """Structured deterministic risk analysis signal."""

    __tablename__ = "risk_signals"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    action_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("execution_requests.id"), nullable=False
    )
    signal_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(128), nullable=False)
    score: Mapped[Decimal | None] = mapped_column(Numeric(8, 5), nullable=True)
    confidence: Mapped[Decimal | None] = mapped_column(Numeric(8, 5), nullable=True)
    evidence: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
