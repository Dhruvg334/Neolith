"""System-wide governance control, emergency stop, and revocation epoch endpoints (UC8, F09)."""

import os
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


class LLMStatusResponse(BaseModel):
    """Status of LLM provider connectivity and reasoning mode."""

    model_config = ConfigDict(extra="forbid")

    is_online: bool
    provider: str
    model: str
    message: str


@router.get(
    "/llm-status",
    response_model=LLMStatusResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getLLMStatus",
)
def get_llm_status() -> LLMStatusResponse:
    """Report LLM connectivity status, provider, and model."""
    disable_gemini = os.getenv("DISABLE_GEMINI", "").strip().lower() in ("true", "1", "yes")
    if disable_gemini:
        return LLMStatusResponse(
            is_online=False,
            provider="deterministic_mock",
            model="deterministic-financial-reasoner",
            message="Financial Agent is offline — testcases are being used for the time",
        )

    gemini_key = (
        os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("GOOGLE_API_KEY")
    )
    openai_key = os.getenv("OPENAI_API_KEY")
    explicit_provider = (os.getenv("LLM_PROVIDER") or "").strip().lower()

    if gemini_key or explicit_provider == "gemini":
        raw_model = os.getenv("GEMINI_MODEL") or os.getenv("LLM_MODEL_FAST") or "gemini-3.5-flash"
        norm_model = raw_model.strip().lower().replace(" ", "-")
        if norm_model in ("3.5-flash", "flash-3.5", "3.5"):
            model_name = "gemini-3.5-flash"
        elif not norm_model.startswith("gemini-"):
            model_name = f"gemini-{norm_model}"
        else:
            model_name = norm_model
        if gemini_key:
            return LLMStatusResponse(
                is_online=True,
                provider="gemini",
                model=model_name,
                message="Connected to Google Gemini (Active Production Reasoning)",
            )
        return LLMStatusResponse(
            is_online=False,
            provider="gemini",
            model=model_name,
            message="Financial Agent is offline — testcases are being used for the time",
        )

    if openai_key or explicit_provider == "openai":
        model_name = os.getenv("LLM_MODEL_FAST") or "gpt-4o-mini"
        if openai_key:
            return LLMStatusResponse(
                is_online=True,
                provider="openai",
                model=model_name,
                message="Connected to OpenAI (Active Production Reasoning)",
            )
        return LLMStatusResponse(
            is_online=False,
            provider="openai",
            model=model_name,
            message="Financial Agent is offline — testcases are being used for the time",
        )

    return LLMStatusResponse(
        is_online=False,
        provider="deterministic_mock",
        model="deterministic-financial-reasoner",
        message="Financial Agent is offline — testcases are being used for the time",
    )
