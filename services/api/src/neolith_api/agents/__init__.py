"""Agent and immutable AgentVersion registry models (F04, F11)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from neolith_api.users import EntityStatus


class AgentSchema(BaseModel):
    """Logical registered AI agent."""

    id: UUID
    name: str
    description: str
    owner_user_id: UUID | None = None
    status: EntityStatus = "active"
    created_at: datetime


class AgentVersionSchema(BaseModel):
    """Immutable agent deployment manifest."""

    id: UUID
    agent_id: UUID
    version: str
    framework: str
    model_manifest: dict[str, Any] = Field(default_factory=dict)
    prompt_manifest: dict[str, Any] = Field(default_factory=dict)
    tool_manifest: dict[str, Any] = Field(default_factory=dict)
    artifact_digest: str
    status: EntityStatus = "inactive"
    created_at: datetime
