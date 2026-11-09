"""Interaction Core persistence and routing service (Part E)."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from neolith_agent.interfaces import InterfaceResponse
from neolith_api.core.models import TaskModel, UserModel
from neolith_api.interactions.models import ChannelSession, InteractionTurnRecord


def mask_phone_number(address: str | None) -> str:
    """Mask phone numbers in logs and traces (e.g. +919876543210 -> +9198****3210)."""
    if not address:
        return ""
    prefix = ""
    clean = address
    if clean.startswith("whatsapp:"):
        prefix = "whatsapp:"
        clean = clean[len("whatsapp:") :]

    if len(clean) <= 6:
        return f"{prefix}******"

    if clean.startswith("+91") and len(clean) == 13:
        return f"{prefix}{clean[:5]}****{clean[-4:]}"

    if clean.startswith("+1") and len(clean) == 12:
        return f"{prefix}{clean[:5]}****{clean[-3:]}"

    visible_start = min(5, len(clean) // 2)
    visible_end = min(4, len(clean) // 3)
    return f"{prefix}{clean[:visible_start]}****{clean[-visible_end:]}"


class InteractionCoreService:
    """Core domain logic for multi-channel sessions, idempotency, and turn persistence."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_session(
        self,
        *,
        channel: str,
        provider: str,
        external_session_ref: str | None = None,
        external_user_ref: str | None = None,
        user_id: UUID | None = None,
    ) -> ChannelSession:
        """Find an existing active channel session or provision a new one."""
        query = select(ChannelSession).where(
            ChannelSession.channel == channel,
            ChannelSession.provider == provider,
            ChannelSession.status == "active",
        )
        if external_session_ref:
            query = query.where(ChannelSession.external_session_ref == external_session_ref)
        elif external_user_ref:
            query = query.where(ChannelSession.external_user_ref == external_user_ref)

        session = self.db.scalars(query).first()
        if session is not None:
            return session

        # Resolve reference user if user_id is None
        resolved_user_id = user_id
        if resolved_user_id is None:
            user = self.db.scalars(select(UserModel).where(UserModel.role == "user")).first()
            if user:
                resolved_user_id = user.id

        new_session = ChannelSession(
            id=uuid4(),
            channel=channel,
            provider=provider,
            external_session_ref=external_session_ref,
            external_user_ref=external_user_ref,
            user_id=resolved_user_id,
            status="active",
        )
        self.db.add(new_session)
        self.db.flush()
        return new_session

    def resolve_task_for_session(
        self,
        session: ChannelSession,
        request_text: str,
        existing_task_id: UUID | None = None,
    ) -> TaskModel:
        """Associate turn with an existing task or create a new task record."""
        if existing_task_id:
            task = self.db.get(TaskModel, existing_task_id)
            if task:
                session.active_task_id = task.id
                self.db.flush()
                return task

        if session.active_task_id:
            active_task = self.db.get(TaskModel, session.active_task_id)
            if active_task and active_task.state not in ("completed", "cancelled", "denied"):
                return active_task

        # Ensure we have a user_id for the task
        owner_id = session.user_id
        if owner_id is None:
            user = self.db.scalars(select(UserModel).where(UserModel.role == "user")).first()
            owner_id = user.id if user else uuid4()

        new_task = TaskModel(
            id=uuid4(),
            user_id=owner_id,
            original_request=request_text,
            objective=request_text[:128],
            state="planning",
            trace_id=f"trace-{uuid4().hex[:12]}",
        )
        self.db.add(new_task)
        self.db.flush()

        session.active_task_id = new_task.id
        self.db.flush()
        return new_task

    def check_duplicate_message(
        self, provider_message_id: str | None
    ) -> InteractionTurnRecord | None:
        """Check if an inbound provider_message_id has already been processed."""
        if not provider_message_id:
            return None
        return self.db.scalars(
            select(InteractionTurnRecord).where(
                InteractionTurnRecord.provider_message_id == provider_message_id
            )
        ).first()

    def record_inbound_turn(
        self,
        *,
        session: ChannelSession,
        task_id: UUID | None,
        text: str,
        provider_message_id: str | None = None,
        trace_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> InteractionTurnRecord:
        """Persist an inbound interaction turn."""
        turn = InteractionTurnRecord(
            id=uuid4(),
            channel_session_id=session.id,
            task_id=task_id,
            provider_message_id=provider_message_id,
            direction="inbound",
            content=text,
            status="processing",
            trace_id=trace_id,
            metadata_payload=metadata or {},
        )
        self.db.add(turn)
        self.db.flush()
        return turn

    def record_outbound_turn(
        self,
        *,
        session: ChannelSession,
        task_id: UUID | None,
        response: InterfaceResponse,
        provider_message_id: str | None = None,
    ) -> InteractionTurnRecord:
        """Persist an outbound agent response turn."""
        turn = InteractionTurnRecord(
            id=uuid4(),
            channel_session_id=session.id,
            task_id=task_id,
            provider_message_id=provider_message_id,
            direction="outbound",
            content=response.message,
            status="completed",
            trace_id=response.trace_id,
            metadata_payload={
                "status": response.status,
                "evidence_refs": response.evidence_refs,
                "has_proposal": response.proposed_action is not None,
            },
            completed_at=datetime.now(UTC),
        )
        self.db.add(turn)
        self.db.flush()
        return turn
