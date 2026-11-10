"""Tamper-evident append-only Decision Receipts and chain verification endpoints (F13)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.governance.service import GovernanceRuntimeService
from neolith_api.receipts import DecisionReceiptSchema, ReceiptVerificationResponse

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.get(
    "",
    response_model=list[DecisionReceiptSchema],
    status_code=status.HTTP_200_OK,
    operation_id="listDecisionReceipts",
)
def list_receipts(
    session: Annotated[Session, Depends(get_db_session)],
    action_id: Annotated[
        UUID | None, Query(description="Filter receipts for a specific action ID")
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[DecisionReceiptSchema]:
    """List append-only tamper-evident decision receipts ordered newest first."""
    service = GovernanceRuntimeService(session)
    return service.list_receipts(action_id=action_id, limit=limit, offset=offset)


@router.get(
    "/verify",
    response_model=ReceiptVerificationResponse,
    status_code=status.HTTP_200_OK,
    operation_id="verifyReceiptsChain",
)
def verify_receipts_chain(
    session: Annotated[Session, Depends(get_db_session)],
) -> ReceiptVerificationResponse:
    """Verify cryptographic SHA-256 hash-chain integrity from genesis to current head receipt."""
    service = GovernanceRuntimeService(session)
    return service.verify_receipt_chain()


@router.get(
    "/{receipt_id}",
    response_model=DecisionReceiptSchema,
    status_code=status.HTTP_200_OK,
    operation_id="getDecisionReceipt",
)
def get_receipt(
    receipt_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> DecisionReceiptSchema:
    """Retrieve an immutable Decision Receipt by receipt ID or associated action ID."""
    service = GovernanceRuntimeService(session)
    record = service.get_receipt(receipt_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision receipt '{receipt_id}' not found.",
        )
    return record
