"""ElevenLabs Custom LLM Chat Completions voice adapter (Part I)."""

import json
import logging
import secrets
import time
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from neolith_agent.interfaces import InteractionTurn, InterfaceResponse
from neolith_api.core.config import get_settings
from neolith_api.core.database import get_db_session
from neolith_api.integrations.agent_client import AgentWorkerClient
from neolith_api.interactions.service import (
    InteractionCoreService,
    attach_governance_to_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice"])


class ChatMessage(BaseModel):
    """OpenAI-compatible chat message payload."""

    model_config = ConfigDict(extra="ignore")

    role: str
    content: str


class ElevenLabsChatCompletionsRequest(BaseModel):
    """OpenAI-compatible request payload sent by ElevenLabs Custom LLM."""

    model_config = ConfigDict(extra="ignore")

    model: str = "neolith-financial-agent"
    messages: list[ChatMessage] = Field(min_length=1)
    stream: bool = True
    user: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None


async def _sse_chunk_generator(
    response: InterfaceResponse,
    model: str,
) -> AsyncGenerator[str, None]:
    """Generate OpenAI-compatible SSE chunks for streaming chat completion."""
    chunk_id = f"chatcmpl-{uuid4().hex[:12]}"
    created = int(time.time())

    # Chunk with message content
    delta_payload: dict[str, Any] = {
        "id": chunk_id,
        "object": "chat.completion.chunk",
        "created": created,
        "model": model,
        "choices": [
            {
                "index": 0,
                "delta": {"role": "assistant", "content": response.message},
                "finish_reason": None,
            }
        ],
    }
    yield f"data: {json.dumps(delta_payload)}\n\n"

    # Termination chunk
    stop_payload: dict[str, Any] = {
        "id": chunk_id,
        "object": "chat.completion.chunk",
        "created": created,
        "model": model,
        "choices": [
            {
                "index": 0,
                "delta": {},
                "finish_reason": "stop",
            }
        ],
    }
    yield f"data: {json.dumps(stop_payload)}\n\n"
    yield "data: [DONE]\n\n"


@router.post(
    "/integrations/elevenlabs/v1/chat/completions",
    status_code=status.HTTP_200_OK,
    operation_id="elevenLabsChatCompletions",
)
async def post_elevenlabs_chat_completions(
    payload: ElevenLabsChatCompletionsRequest,
    request: Request,
    session: Annotated[Session, Depends(get_db_session)],
    authorization: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    """Stream OpenAI-compatible SSE chat completions for ElevenLabs Custom LLM."""
    settings = getattr(request.app.state, "settings", None) or get_settings()

    # 1. Bearer Token Authentication with constant-time comparison
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Missing or malformed Authorization header on ElevenLabs endpoint")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Bearer authentication token.",
        )

    provided_token = authorization.split("Bearer ", 1)[1].strip()
    configured_token = settings.elevenlabs_custom_llm_bearer_token

    if not configured_token or not secrets.compare_digest(provided_token, configured_token):
        logger.warning("Invalid ElevenLabs bearer token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid integration bearer token.",
        )

    # 2. Extract latest user message
    user_messages = [msg for msg in payload.messages if msg.role == "user"]
    if not user_messages or not user_messages[-1].content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation must include at least one non-empty user message.",
        )
    latest_user_text = user_messages[-1].content.strip()

    # 3. Session Continuity: check headers or payload.user
    session_ref = (
        request.headers.get("x-conversation-id")
        or request.headers.get("x-session-id")
        or payload.user
        or f"voice-session-{uuid4().hex[:8]}"
    )

    # 4. Resolve or create ChannelSession and Task
    core_service = InteractionCoreService(session)
    channel_session = core_service.get_or_create_session(
        channel="voice",
        provider="elevenlabs",
        external_session_ref=session_ref,
        external_user_ref=payload.user or session_ref,
    )
    task = core_service.resolve_task_for_session(
        session=channel_session,
        request_text=latest_user_text,
    )
    trace_id = task.trace_id or f"trace-{uuid4().hex[:12]}"

    # 5. Persist inbound InteractionTurn
    core_service.record_inbound_turn(
        session=channel_session,
        task_id=task.id,
        text=latest_user_text,
        trace_id=trace_id,
        metadata={"session_ref": session_ref, "model": payload.model},
    )
    session.commit()

    # 6. Canonical InteractionTurn for Financial AI Agent
    interaction_id = uuid4()
    turn = InteractionTurn(
        interaction_id=interaction_id,
        channel="voice",
        provider="elevenlabs",
        external_session_ref=session_ref,
        external_user_ref=payload.user or session_ref,
        user_id=channel_session.user_id,
        task_id=task.id,
        text=latest_user_text,
        received_at=datetime.now(UTC),
        metadata={"trace_id": trace_id},
    )

    # 7. Invoke the same Financial AI Agent worker
    agent_client = AgentWorkerClient()
    response: InterfaceResponse = await agent_client.process_turn(turn)

    # Authoritative Governance evaluation if an action was proposed
    attach_governance_to_response(
        response,
        session,
        user_id=channel_session.user_id,
        task_id=task.id,
        trace_id=trace_id,
    )

    # 8. Persist outbound turn
    core_service.record_outbound_turn(
        session=channel_session,
        task_id=task.id,
        response=response,
    )
    session.commit()

    # 9. Return text/event-stream with OpenAI SSE chunks terminating with [DONE]
    return StreamingResponse(
        _sse_chunk_generator(response, payload.model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
