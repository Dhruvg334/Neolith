"""Permission binding models and deterministic evaluation interface (F04)."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from neolith_api.users import EntityStatus

SubjectType = Literal["user", "role", "agent"]
PermissionEffect = Literal["allow", "deny"]


class PermissionBindingSchema(BaseModel):
    """Capability binding assigned to a user, role, or agent."""

    id: UUID
    subject_type: SubjectType
    subject_id: str
    capability: str
    resource_scope: dict[str, Any] = Field(default_factory=dict)
    effect: PermissionEffect
    status: EntityStatus = "active"
    created_at: datetime
