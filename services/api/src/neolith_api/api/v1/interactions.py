"""Web Interaction API endpoints for the Financial AI Agent (Part F)."""

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from neolith_agent.interfaces import InteractionTurn, InterfaceResponse
from neolith_api.core.database import get_db_session
from neolith_api.integrations.agent_client import AgentWorkerClient
from neolith_api.interactions.service import (
    InteractionCoreService,
    attach_governance_to_response,
)

router = APIRouter(prefix="/interactions", tags=["interactions"])


class WebInteractionRequest(BaseModel):
    """User message sent from the Neolith Web application."""

    text: str = Field(min_length=1, max_length=12_000)
    task_id: UUID | None = None


@router.post(
    "/message",
    response_model=InterfaceResponse,
    status_code=status.HTTP_200_OK,
    operation_id="sendWebInteractionMessage",
)
async def post_web_message(
    payload: WebInteractionRequest,
    session: Annotated[Session, Depends(get_db_session)],
) -> InterfaceResponse:
    """Send a user message to the Financial AI Agent through the Web interface."""
    core_service = InteractionCoreService(session)

    # Resolve or create the web channel session
    channel_session = core_service.get_or_create_session(
        channel="web",
        provider="neolith_web",
        external_session_ref="web-session-default",
    )

    # Associate with existing task or create a new one
    task = core_service.resolve_task_for_session(
        session=channel_session,
        request_text=payload.text,
        existing_task_id=payload.task_id,
    )
    trace_id = task.trace_id or f"trace-{uuid4().hex[:12]}"

    # Normalise into canonical InteractionTurn
    interaction_id = uuid4()
    turn = InteractionTurn(
        interaction_id=interaction_id,
        channel="web",
        provider="neolith_web",
        external_session_ref=channel_session.external_session_ref,
        user_id=channel_session.user_id,
        task_id=task.id,
        text=payload.text,
        received_at=datetime.now(UTC),
        metadata={"trace_id": trace_id},
    )

    # Persist inbound turn
    core_service.record_inbound_turn(
        session=channel_session,
        task_id=task.id,
        text=payload.text,
        trace_id=trace_id,
    )
    session.commit()

    # Invoke the Financial Agent worker
    agent_client = AgentWorkerClient()
    response = await agent_client.process_turn(turn)

    # Authoritative Governance evaluation if an action was proposed
    attach_governance_to_response(
        response,
        session,
        user_id=channel_session.user_id,
        task_id=task.id,
        trace_id=trace_id,
    )

    # Persist outbound response
    core_service.record_outbound_turn(
        session=channel_session,
        task_id=task.id,
        response=response,
    )
    session.commit()

    return response
