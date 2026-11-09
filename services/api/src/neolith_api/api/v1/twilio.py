"""Twilio WhatsApp webhook adapter (Part H)."""

import logging
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    Header,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy.orm import Session, sessionmaker
from twilio.request_validator import RequestValidator

from neolith_agent.interfaces import InteractionTurn, InterfaceResponse
from neolith_api.core.config import Settings, get_settings
from neolith_api.core.database import get_db_session
from neolith_api.integrations.agent_client import AgentWorkerClient
from neolith_api.integrations.twilio import TwilioOutboundClient
from neolith_api.interactions.service import InteractionCoreService, mask_phone_number

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations/twilio", tags=["integrations"])


async def _process_whatsapp_turn_background(
    session_factory: sessionmaker[Session],
    turn: InteractionTurn,
    session_id: UUID,
    from_number: str,
    settings: Settings,
    outbound_client: TwilioOutboundClient | None = None,
) -> None:
    """Execute the Financial AI Agent workflow and send outbound WhatsApp response."""
    masked_from = mask_phone_number(from_number)
    logger.info("Processing background WhatsApp turn for %s", masked_from)

    agent_client = AgentWorkerClient()
    response: InterfaceResponse = await agent_client.process_turn(turn)

    with session_factory() as db:
        core_service = InteractionCoreService(db)
        from neolith_api.interactions.models import ChannelSession
        from neolith_api.interactions.service import attach_governance_to_response

        chan_sess = db.get(ChannelSession, session_id)
        if chan_sess is not None:
            attach_governance_to_response(
                response,
                db,
                user_id=chan_sess.user_id,
                task_id=turn.task_id,
                trace_id=turn.metadata.get("trace_id") if isinstance(turn.metadata, dict) else None,
            )
            core_service.record_outbound_turn(
                session=chan_sess,
                task_id=turn.task_id,
                response=response,
                provider_message_id=turn.provider_message_id,
            )
            db.commit()

    # Dispatch outbound message via Twilio
    client = outbound_client or TwilioOutboundClient(
        account_sid=settings.twilio_account_sid,
        auth_token=settings.twilio_auth_token,
        from_number=settings.twilio_whatsapp_from,
    )
    try:
        client.send_message(to=from_number, body=response.message)
    except Exception as exc:
        logger.error("Failed to send outbound WhatsApp reply to %s: %s", masked_from, exc)


@router.post(
    "/whatsapp/webhook",
    status_code=status.HTTP_200_OK,
    operation_id="handleTwilioWhatsAppWebhook",
)
async def post_whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    session: Annotated[Session, Depends(get_db_session)],
    message_sid: Annotated[str | None, Form(alias="MessageSid")] = None,
    from_number: Annotated[str | None, Form(alias="From")] = None,
    to_number: Annotated[str | None, Form(alias="To")] = None,
    body: Annotated[str | None, Form(alias="Body")] = None,
    x_twilio_signature: Annotated[str | None, Header(alias="X-Twilio-Signature")] = None,
) -> Response:
    """Twilio WhatsApp inbound webhook with official signature validation and idempotency."""
    settings: Settings = getattr(request.app.state, "settings", None) or get_settings()

    # 1. Validate required fields
    if not message_sid or not from_number or not to_number or body is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required Twilio parameters (MessageSid, From, To, Body).",
        )

    # 2. Twilio signature validation using official RequestValidator
    if not x_twilio_signature:
        logger.warning("Missing X-Twilio-Signature header")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing Twilio signature.",
        )

    auth_token = settings.twilio_auth_token
    # Determine the validation URL: canonical public URL or request URL
    validation_url = settings.twilio_whatsapp_webhook_public_url or str(request.url)

    # Collect form parameters for signature validation
    form_data = await request.form()
    params = {k: str(v) for k, v in form_data.items()}

    validator = RequestValidator(auth_token)
    if not validator.validate(validation_url, params, x_twilio_signature):
        logger.warning("Invalid Twilio signature for URL: %s", validation_url)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Twilio signature.",
        )

    masked_from = mask_phone_number(from_number)
    logger.info(
        "Received authenticated WhatsApp webhook from %s with SID %s", masked_from, message_sid
    )

    # 3. Idempotency deduplication by MessageSid
    core_service = InteractionCoreService(session)
    existing_turn = core_service.check_duplicate_message(message_sid)
    if existing_turn is not None:
        logger.info(
            "Duplicate MessageSid %s detected; acknowledging without reprocessing", message_sid
        )
        return Response(content="<Response></Response>", media_type="application/xml")

    # 4. Resolve ChannelSession and Task
    channel_session = core_service.get_or_create_session(
        channel="whatsapp",
        provider="twilio",
        external_session_ref=from_number,
        external_user_ref=from_number,
    )
    task = core_service.resolve_task_for_session(
        session=channel_session,
        request_text=body,
    )
    trace_id = task.trace_id or f"trace-{uuid4().hex[:12]}"

    # 5. Persist inbound InteractionTurn
    core_service.record_inbound_turn(
        session=channel_session,
        task_id=task.id,
        text=body,
        provider_message_id=message_sid,
        trace_id=trace_id,
        metadata={
            "to": mask_phone_number(to_number),
            "from": masked_from,
            "message_sid": message_sid,
        },
    )
    session.commit()

    # 6. Canonical InteractionTurn for Financial Agent
    turn = InteractionTurn(
        interaction_id=uuid4(),
        channel="whatsapp",
        provider="twilio",
        external_session_ref=from_number,
        external_user_ref=from_number,
        user_id=channel_session.user_id,
        task_id=task.id,
        text=body,
        provider_message_id=message_sid,
        received_at=datetime.now(UTC),
        metadata={"trace_id": trace_id},
    )

    # 7. Acknowledge Twilio promptly and delegate Financial Agent processing to background task
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    # Check if a test outbound client is attached to app state
    test_outbound: TwilioOutboundClient | None = getattr(
        request.app.state, "test_twilio_outbound", None
    )

    background_tasks.add_task(
        _process_whatsapp_turn_background,
        session_factory=session_factory,
        turn=turn,
        session_id=channel_session.id,
        from_number=from_number,
        settings=settings,
        outbound_client=test_outbound,
    )

    return Response(content="<Response></Response>", media_type="application/xml")
