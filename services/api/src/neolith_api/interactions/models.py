"""SQLAlchemy 2.0 ORM models for multi-channel interaction persistence (Part E)."""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from neolith_api.core.database import Base
from neolith_api.core.models import TaskModel, UserModel, utc_now


class ChannelSession(Base):
    """Routing session binding an external channel/provider user to an active task."""

    __tablename__ = "channel_sessions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)  # web, whatsapp, voice
    provider: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # neolith_web, twilio, elevenlabs
    external_session_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_user_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    active_task_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    user: Mapped[UserModel | None] = relationship("UserModel")
    active_task: Mapped[TaskModel | None] = relationship("TaskModel")
    turns: Mapped[list["InteractionTurnRecord"]] = relationship(
        "InteractionTurnRecord", back_populates="channel_session", cascade="all, delete-orphan"
    )


class InteractionTurnRecord(Base):
    """Audit record for an inbound or outbound turn within a channel session."""

    __tablename__ = "interaction_turns"
    __table_args__ = (
        Index("ix_interaction_turns_provider_msg", "provider_message_id"),
        Index("ix_interaction_turns_session_created", "channel_session_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    channel_session_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("channel_sessions.id"), nullable=False
    )
    task_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)  # inbound, outbound
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="received"
    )  # received, processing, completed, error
    trace_id: Mapped[str] = mapped_column(String(128), nullable=False)
    metadata_payload: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    channel_session: Mapped[ChannelSession] = relationship("ChannelSession", back_populates="turns")
    task: Mapped[TaskModel | None] = relationship("TaskModel")
