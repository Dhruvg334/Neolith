"""Health and readiness endpoints for Neolith API."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel

from neolith_api.core.config import Settings, get_settings
from neolith_api.core.dependencies import (
    DependencyInspector,
    RuntimeDependencyInspector,
)

router = APIRouter(tags=["system"])


class HealthResponseModel(BaseModel):
    """Response payload for GET /api/v1/health."""

    status: Literal["ok"]
    service: str
    version: str


class DependencyStatusModel(BaseModel):
    """Per-dependency status reported by GET /api/v1/ready."""

    status: Literal["ok", "error"]
    detail: str | None = None


class DependenciesMapModel(BaseModel):
    """Map of external dependencies inspected by GET /api/v1/ready."""

    postgres: DependencyStatusModel
    redis: DependencyStatusModel
    opa: DependencyStatusModel


class ReadinessResponseModel(BaseModel):
    """Response payload for GET /api/v1/ready."""

    status: Literal["ready", "degraded"]
    service: str
    version: str
    dependencies: DependenciesMapModel


def get_dependency_inspector(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> DependencyInspector:
    """Resolve the configured DependencyInspector from app state or create a runtime instance."""
    override = getattr(request.app.state, "dependency_inspector", None)
    if override is not None:
        return override  # type: ignore[no-any-return]
    return RuntimeDependencyInspector(settings=settings)


@router.get(
    "/health",
    response_model=HealthResponseModel,
    status_code=status.HTTP_200_OK,
    operation_id="getHealth",
)
async def get_health(
    settings: Annotated[Settings, Depends(get_settings)],
) -> HealthResponseModel:
    """Return service liveness without depending on external infrastructure or LLM providers."""
    return HealthResponseModel(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
    )


@router.get(
    "/ready",
    response_model=ReadinessResponseModel,
    responses={
        status.HTTP_200_OK: {"model": ReadinessResponseModel},
        status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ReadinessResponseModel},
    },
    operation_id="getReadiness",
)
async def get_readiness(
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
    inspector: Annotated[DependencyInspector, Depends(get_dependency_inspector)],
) -> ReadinessResponseModel:
    """Inspect configured infrastructure dependencies (PostgreSQL, Redis, OPA) safely."""
    report = await inspector.inspect()
    if not report.is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessResponseModel(
        status="ready" if report.is_ready else "degraded",
        service=settings.service_name,
        version=settings.service_version,
        dependencies=DependenciesMapModel(
            postgres=DependencyStatusModel(
                status=report.postgres.status,
                detail=report.postgres.detail,
            ),
            redis=DependencyStatusModel(
                status=report.redis.status,
                detail=report.redis.detail,
            ),
            opa=DependencyStatusModel(
                status=report.opa.status,
                detail=report.opa.detail,
            ),
        ),
    )
