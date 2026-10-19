"""Tamper-evident hash-linked Decision Receipt models (F13)."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

ReceiptEventType = Literal[
    "action_received",
    "decision",
    "approval",
    "permit_issued",
    "permit_rejected",
    "execution",
    "reconciliation",
    "revocation",
    "correction",
]


class DecisionReceiptSchema(BaseModel):
    """Append-only Decision Receipt matching specs/schemas/decision-receipt.schema.json."""

    receipt_id: UUID
    chain_index: int = Field(ge=0)
    action_id: UUID
    event_type: ReceiptEventType
    payload: dict[str, Any]
    payload_hash: str
    previous_receipt_hash: str | None = None
    receipt_hash: str
    created_at: datetime
