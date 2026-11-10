"""Human approval checkpoint and review queue endpoints (F08)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from neolith_api.approvals import (
    ApprovalDecisionRequest,
    ApprovalDecisionResponse,
    ApprovalEnrichedRead,
)
from neolith_api.core.database import get_db_session
from neolith_api.governance.service import GovernanceRuntimeService

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get(
    "",
    response_model=list[ApprovalEnrichedRead],
    status_code=status.HTTP_200_OK,
    operation_id="listApprovals",
)
def list_approvals(
    session: Annotated[Session, Depends(get_db_session)],
    state: Annotated[
        str | None,
        Query(description="Filter approvals by state: pending, approved, rejected, expired"),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[ApprovalEnrichedRead]:
    """List pending and decided human approval checkpoints enriched with context."""
    service = GovernanceRuntimeService(session)
    return service.list_approvals(state=state, limit=limit, offset=offset)


@router.get(
    "/{approval_id}",
    response_model=ApprovalEnrichedRead,
    status_code=status.HTTP_200_OK,
    operation_id="getApproval",
)
def get_approval(
    approval_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> ApprovalEnrichedRead:
    """Retrieve details for a single human approval checkpoint by ID."""
    service = GovernanceRuntimeService(session)
    record = service.get_approval(approval_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval checkpoint '{approval_id}' not found.",
        )
    return record


@router.post(
    "/{approval_id}/decision",
    response_model=ApprovalDecisionResponse,
    status_code=status.HTTP_200_OK,
    operation_id="decideApproval",
)
def decide_approval(
    approval_id: UUID,
    payload: ApprovalDecisionRequest,
    session: Annotated[Session, Depends(get_db_session)],
) -> ApprovalDecisionResponse:
    """Submit operator decision (approve or reject) for a pending human checkpoint.

    On approval:
    - Issues single-use Execution Permit (F09).
    - Executes settlement if paying an invoice (F10).
    - Appends tamper-evident audit receipts to the cryptographic chain (F13).
    """
    service = GovernanceRuntimeService(session)
    try:
        response = service.decide_approval(
            approval_id=approval_id,
            decision=payload.decision,
            note=payload.note,
            decided_by=payload.decided_by,
        )
        session.commit()
        return response
    except ValueError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
