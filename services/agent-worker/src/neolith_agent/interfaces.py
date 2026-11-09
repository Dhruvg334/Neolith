"""Transport-neutral interaction contracts shared by web, WhatsApp, and voice adapters."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from neolith_agent.state import FinancialActionProposal

InteractionChannel = Literal["web", "whatsapp", "voice"]
InteractionProvider = Literal["neolith_web", "twilio", "elevenlabs"]
InterfaceResponseStatus = Literal[
    "accepted",
    "needs_clarification",
    "proposal_ready",
    "completed",
    "error",
]


class InteractionTurn(BaseModel):
    """Canonical inbound user turn after provider-specific normalisation."""

    model_config = ConfigDict(extra="forbid")

    interaction_id: UUID
    channel: InteractionChannel
    provider: InteractionProvider
    external_session_ref: str | None = None
    external_user_ref: str | None = None
    user_id: UUID | None = None
    task_id: UUID | None = None
    text: str = Field(min_length=1, max_length=12_000)
    provider_message_id: str | None = None
    received_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class InterfaceResponse(BaseModel):
    """Transport-neutral Financial Agent response returned to any interface adapter."""

    model_config = ConfigDict(extra="forbid")

    interaction_id: UUID
    task_id: UUID
    trace_id: str = Field(min_length=8)
    status: InterfaceResponseStatus
    message: str
    proposed_action: FinancialActionProposal | None = None
    evidence_refs: list[str] = Field(default_factory=list)
