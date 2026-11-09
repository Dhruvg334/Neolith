"""Action evaluation and execution request endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.governance.schemas import (
    ActionEvaluationRequest,
    ExecutionRequestRead,
    GovernanceDecisionRead,
)
from neolith_api.governance.service import GovernanceRuntimeService

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post(
    "/evaluate",
    response_model=GovernanceDecisionRead,
    status_code=status.HTTP_200_OK,
    operation_id="evaluateAction",
)
def evaluate_action(
    payload: ActionEvaluationRequest,
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceDecisionRead:
    """Evaluate an action proposal against authoritative policy invariants and active profile."""
    service = GovernanceRuntimeService(session)
    result = service.evaluate_action(payload)
    session.commit()
    return result


@router.get(
    "/{action_id}",
    response_model=ExecutionRequestRead,
    status_code=status.HTTP_200_OK,
    operation_id="getActionExecutionRequest",
)
def get_action(
    action_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> ExecutionRequestRead:
    """Retrieve an execution request and its attached governance decision by action ID."""
    service = GovernanceRuntimeService(session)
    record = service.get_execution_request(action_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution request '{action_id}' not found.",
        )
    return record
