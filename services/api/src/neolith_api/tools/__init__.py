"""Tool and ToolVersion connector registry models (F10)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from neolith_api.users import EntityStatus

ToolProtocol = Literal["mcp", "rest", "a2a"]
RiskTier = Literal["R0", "R1", "R2", "R3", "R4"]
Reversibility = Literal["reversible", "compensatable", "irreversible"]


class ToolSchema(BaseModel):
    """Logical capability exposed to an agent."""

    id: UUID
    name: str
    protocol: ToolProtocol
    risk_tier: RiskTier
    reversibility: Reversibility
    status: EntityStatus = "active"
    created_at: datetime


class ToolVersionSchema(BaseModel):
    """Immutable tool version binding schema hashes and endpoint."""

    id: UUID
    tool_id: UUID
    version: str
    description_hash: str
    input_schema_hash: str
    output_schema_hash: str
    endpoint_ref: str
    status: EntityStatus = "inactive"
    created_at: datetime
