"""Core platform SQLAlchemy 2.0 ORM models (User, Agent, Tool, Task, Budget, SystemState)."""

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
    """Return current timezone-aware UTC datetime."""
    return datetime.now(UTC)


class UserModel(Base):
    """Registered enterprise user or operator identity."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class AgentModel(Base):
    """Logical registered AI agent."""

    __tablename__ = "agents"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    owner_user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class AgentVersionModel(Base):
    """Immutable agent deployment manifest."""

    __tablename__ = "agent_versions"
    __table_args__ = (UniqueConstraint("agent_id", "version", name="uq_agent_versions_agent_ver"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    agent_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    framework: Mapped[str] = mapped_column(String(64), nullable=False)
    model_manifest: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    prompt_manifest: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    tool_manifest: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    artifact_digest: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="inactive")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class ToolModel(Base):
    """Logical capability exposed to an agent."""

    __tablename__ = "tools"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    protocol: Mapped[str] = mapped_column(String(32), nullable=False, default="mcp")
    risk_tier: Mapped[str] = mapped_column(String(8), nullable=False, default="R1")
    reversibility: Mapped[str] = mapped_column(String(32), nullable=False, default="reversible")
    read_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    protected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    required_capability: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class ToolVersionModel(Base):
    """Immutable tool version binding schema hashes and endpoint."""

    __tablename__ = "tool_versions"
    __table_args__ = (UniqueConstraint("tool_id", "version", name="uq_tool_versions_tool_ver"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    tool_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tools.id"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    description_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    input_schema: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    output_schema: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    input_schema_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    output_schema_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    endpoint_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class TaskModel(Base):
    """User goal and workflow state record."""

    __tablename__ = "tasks"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    original_request: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    constraints: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    state: Mapped[str] = mapped_column(String(64), nullable=False, default="draft")
    trace_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class BudgetModel(Base):
    """Authoritative financial or resource budget limit using exact Decimal arithmetic."""

    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("owner_type", "owner_id", "period_type", name="uq_budgets_owner_period"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_type: Mapped[str] = mapped_column(String(32), nullable=False)
    owner_id: Mapped[str] = mapped_column(String(128), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    limit_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    approval_threshold: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    period_type: Mapped[str] = mapped_column(String(32), nullable=False, default="month")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class SystemStateModel(Base):
    """Singleton system state tracking revocation epoch and emergency stop."""

    __tablename__ = "system_state"

    singleton: Mapped[bool] = mapped_column(Boolean, primary_key=True, default=True)
    revocation_epoch: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    emergency_stop_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
