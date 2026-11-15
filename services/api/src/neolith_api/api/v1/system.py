"""System-wide governance control, emergency stop, and revocation epoch endpoints (UC8, F09)."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.governance.service import GovernanceRuntimeService

router = APIRouter(prefix="/system", tags=["system"])


class SystemStateResponse(BaseModel):
    """Cluster-wide system state tracking emergency stop and revocation epoch."""

    model_config = ConfigDict(extra="forbid")

    emergency_stop_active: bool
    revocation_epoch: int
    updated_at: datetime


@router.get(
    "/state",
    response_model=SystemStateResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getSystemState",
)
def get_system_state(
    session: Annotated[Session, Depends(get_db_session)],
) -> SystemStateResponse:
    """Retrieve current cluster-wide emergency stop flag and permit revocation epoch."""
    service = GovernanceRuntimeService(session)
    state = service.get_system_state()
    return SystemStateResponse(
        emergency_stop_active=state.emergency_stop_active,
        revocation_epoch=int(state.revocation_epoch),
        updated_at=state.updated_at,
    )


@router.post(
    "/emergency-stop",
    response_model=SystemStateResponse,
    status_code=status.HTTP_200_OK,
    operation_id="emergencyStop",
)
def emergency_stop(
    session: Annotated[Session, Depends(get_db_session)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> SystemStateResponse:
    """Activate cluster-wide emergency stop and increment revocation epoch (UC8).

    - Instantly denies all subsequent action proposals across all channels.
    - Invalidates all outstanding unconsumed execution permits via revocation epoch mismatch.
    - Records tamper-evident revocation event in the decision receipt chain.
    """
    service = GovernanceRuntimeService(session)
    state = service.emergency_stop(reason=f"Emergency stop activated (key: {idempotency_key})")
    session.commit()
    return SystemStateResponse(
        emergency_stop_active=state.emergency_stop_active,
        revocation_epoch=int(state.revocation_epoch),
        updated_at=state.updated_at,
    )


@router.post(
    "/restore",
    response_model=SystemStateResponse,
    status_code=status.HTTP_200_OK,
    operation_id="restoreSystem",
)
def restore_system(
    session: Annotated[Session, Depends(get_db_session)],
) -> SystemStateResponse:
    """Restore normal operations after an emergency stop."""
    service = GovernanceRuntimeService(session)
    state = service.restore_system()
    session.commit()
    return SystemStateResponse(
        emergency_stop_active=state.emergency_stop_active,
        revocation_epoch=int(state.revocation_epoch),
        updated_at=state.updated_at,
    )
