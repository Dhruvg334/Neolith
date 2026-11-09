"""Governance profiles and decision inspection API endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.governance.schemas import (
    GovernanceDecisionRead,
    GovernanceProfileCreate,
    GovernanceProfileRead,
    GovernanceProfileUpdate,
)
from neolith_api.governance.service import GovernanceRuntimeService

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get(
    "/profiles",
    response_model=list[GovernanceProfileRead],
    status_code=status.HTTP_200_OK,
    operation_id="listGovernanceProfiles",
)
def list_profiles(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[GovernanceProfileRead]:
    """List all available governance profiles and configurations."""
    service = GovernanceRuntimeService(session)
    profiles = service.list_profiles()
    return [GovernanceProfileRead.model_validate(p) for p in profiles]


@router.get(
    "/profiles/active",
    response_model=GovernanceProfileRead,
    status_code=status.HTTP_200_OK,
    operation_id="getActiveGovernanceProfile",
)
def get_active_profile(
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceProfileRead:
    """Retrieve the currently active enterprise governance profile."""
    service = GovernanceRuntimeService(session)
    profile = service.get_active_profile()
    return GovernanceProfileRead.model_validate(profile)


@router.post(
    "/profiles/{profile_id}/activate",
    response_model=GovernanceProfileRead,
    status_code=status.HTTP_200_OK,
    operation_id="activateGovernanceProfile",
)
def activate_profile(
    profile_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceProfileRead:
    """Activate the specified governance profile as the active policy baseline."""
    service = GovernanceRuntimeService(session)
    try:
        profile = service.activate_profile(profile_id)
        session.commit()
        return GovernanceProfileRead.model_validate(profile)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/profiles",
    response_model=GovernanceProfileRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="createGovernanceProfile",
)
def create_profile(
    payload: GovernanceProfileCreate,
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceProfileRead:
    """Create a new custom governance profile."""
    service = GovernanceRuntimeService(session)
    profile = service.create_profile(payload)
    session.commit()
    return GovernanceProfileRead.model_validate(profile)


@router.put(
    "/profiles/{profile_id}",
    response_model=GovernanceProfileRead,
    status_code=status.HTTP_200_OK,
    operation_id="updateGovernanceProfile",
)
def update_profile(
    profile_id: UUID,
    payload: GovernanceProfileUpdate,
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceProfileRead:
    """Update description or configuration parameters for a governance profile."""
    service = GovernanceRuntimeService(session)
    try:
        profile = service.update_profile(profile_id, payload)
        session.commit()
        return GovernanceProfileRead.model_validate(profile)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/decisions",
    response_model=list[GovernanceDecisionRead],
    status_code=status.HTTP_200_OK,
    operation_id="listGovernanceDecisions",
)
def list_decisions(
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    outcome: Annotated[str | None, Query()] = None,
) -> list[GovernanceDecisionRead]:
    """List recent evaluated governance decisions with reason codes and trace correlation."""
    service = GovernanceRuntimeService(session)
    return service.list_decisions(limit=limit, outcome=outcome)


@router.get(
    "/decisions/{action_id}",
    response_model=GovernanceDecisionRead,
    status_code=status.HTTP_200_OK,
    operation_id="getGovernanceDecision",
)
def get_decision(
    action_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> GovernanceDecisionRead:
    """Retrieve detailed governance decision for a specific action ID."""
    service = GovernanceRuntimeService(session)
    decision = service.get_decision(action_id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Governance decision for action '{action_id}' not found.",
        )
    return decision
