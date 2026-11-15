"""Execution permit verification and consumption endpoints (F09, F10)."""

from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.governance.service import GovernanceRuntimeService

router = APIRouter(prefix="/permits", tags=["permits"])


class ConsumePermitRequest(BaseModel):
    """Optional payload when consuming an execution permit."""

    model_config = ConfigDict(extra="forbid")

    parameters_override: dict[str, Any] | None = Field(
        default=None,
        description="Optional parameter payload to detect tampering against canonical hash.",
    )


class PermitConsumptionResponse(BaseModel):
    """Result of execution permit consumption and financial settlement."""

    model_config = ConfigDict(extra="forbid")

    permit_id: UUID
    action_id: UUID
    status: str
    transaction_id: UUID
    amount: str
    currency: str
    reference: str
    consumed_at: datetime


@router.post(
    "/{permit_id}/consume",
    response_model=PermitConsumptionResponse,
    status_code=status.HTTP_200_OK,
    operation_id="consumePermit",
)
def consume_permit(
    permit_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
    payload: ConsumePermitRequest | None = None,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> PermitConsumptionResponse:
    """Consume a single-use execution permit and execute banking settlement (F09, F10).

    Verifies:
    - Permit is not already consumed (PERMIT_REPLAY prevention)
    - Permit is not expired (PERMIT_EXPIRED)
    - Revocation epoch matches active system state (REVOCATION_EPOCH_MISMATCH)
    - Parameter hash integrity (PARAMETER_HASH_MISMATCH detection)
    """
    service = GovernanceRuntimeService(session)
    try:
        tx = service.consume_permit(
            permit_id=permit_id,
            parameters_override=payload.parameters_override if payload else None,
        )
        session.commit()
        return PermitConsumptionResponse(
            permit_id=permit_id,
            action_id=tx.invoice_id or permit_id,
            status="consumed",
            transaction_id=tx.id,
            amount=str(tx.amount),
            currency=tx.currency,
            reference=tx.reference,
            consumed_at=tx.completed_at or datetime.now(),
        )
    except KeyError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
