"""Short-lived, single-use Execution Permit models (F09)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

PermitState = Literal["issued", "consumed", "expired", "revoked", "rejected"]


class ExecutionPermitClaimsSchema(BaseModel):
    """Execution Permit JWS claims matching specs/schemas/execution-permit.schema.json."""

    iss: str
    aud: str
    sub: str
    jti: UUID
    iat: int
    nbf: int
    exp: int
    user_id: UUID
    task_id: UUID
    action_id: UUID
    tool_id: UUID
    operation: str
    parameters_hash: str
    context_hash: str
    amount: str | None = None
    currency: str | None = None
    reservation_id: UUID | None = None
    policy_digest: str
    revocation_epoch: int = Field(ge=0)


class ExecutionPermitRecordSchema(BaseModel):
    """Authoritative permit metadata stored in PostgreSQL."""

    id: UUID
    action_id: UUID
    reservation_id: UUID | None = None
    token_hash: str
    nonce: str
    audience: str
    revocation_epoch: int = Field(ge=0)
    state: PermitState = "issued"
    issued_at: datetime
    not_before: datetime
    expires_at: datetime
    consumed_at: datetime | None = None
    rejected_reason: str | None = None
