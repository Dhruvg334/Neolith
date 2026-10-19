"""User identity and role models (F04)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

UserRole = Literal["user", "operator", "approver", "auditor", "developer"]
EntityStatus = Literal["active", "inactive", "suspended", "quarantined", "retired"]


class UserSchema(BaseModel):
    """Registered user or operator principal."""

    id: UUID
    email: str | None = None
    display_name: str
    role: UserRole = "user"
    status: EntityStatus = "active"
    created_at: datetime
