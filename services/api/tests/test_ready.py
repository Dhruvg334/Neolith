"""Tests for GET /api/v1/ready readiness inspection behaviour."""

import pytest
from httpx import ASGITransport, AsyncClient

from neolith_api.core.config import Settings
from neolith_api.core.dependencies import (
    DependencyProbeResult,
    ReadinessReport,
    RuntimeDependencyInspector,
)
from neolith_api.main import create_app


class StaticDependencyInspector:
    """Deterministic DependencyInspector test double."""

    def __init__(self, report: ReadinessReport) -> None:
        self._report = report

    async def inspect(self) -> ReadinessReport:
        return self._report


@pytest.mark.asyncio
async def test_ready_endpoint_returns_200_when_all_dependencies_healthy() -> None:
    """GET /api/v1/ready returns 200 ready when PostgreSQL, Redis, and OPA are reachable."""
    app = create_app(settings=Settings(APP_ENV="test"))
    app.state.dependency_inspector = StaticDependencyInspector(
        ReadinessReport(
            postgres=DependencyProbeResult(status="ok"),
            redis=DependencyProbeResult(status="ok"),
            opa=DependencyProbeResult(status="ok"),
        )
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/ready")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["service"] == "neolith-api"
    assert payload["version"] == "0.1.0"
    assert payload["dependencies"] == {
        "postgres": {"status": "ok", "detail": None},
        "redis": {"status": "ok", "detail": None},
        "opa": {"status": "ok", "detail": None},
    }


@pytest.mark.asyncio
async def test_ready_endpoint_returns_503_when_dependency_fails() -> None:
    """GET /api/v1/ready returns 503 degraded when any required dependency fails."""
    app = create_app(settings=Settings(APP_ENV="test"))
    app.state.dependency_inspector = StaticDependencyInspector(
        ReadinessReport(
            postgres=DependencyProbeResult(status="ok"),
            redis=DependencyProbeResult(status="ok"),
            opa=DependencyProbeResult(
                status="error",
                detail="OPA probe failed: ConnectError",
            ),
        )
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/ready")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "degraded"
    assert payload["dependencies"]["postgres"]["status"] == "ok"
    assert payload["dependencies"]["redis"]["status"] == "ok"
    assert payload["dependencies"]["opa"]["status"] == "error"
    assert payload["dependencies"]["opa"]["detail"] == "OPA probe failed: ConnectError"


@pytest.mark.asyncio
async def test_runtime_dependency_inspector_handles_unreachable_endpoints_safely() -> None:
    """RuntimeDependencyInspector reports error status without raising or leaking secrets."""

    settings = Settings(
        APP_ENV="test",
        DATABASE_URL="postgresql+psycopg://neolith:secret_pw@127.0.0.1:59997/neolith",
        REDIS_URL="redis://:secret_redis@127.0.0.1:59998/0",
        OPA_URL="http://127.0.0.1:59999",
        NEOLITH_DEPENDENCY_TIMEOUT_SECONDS=0.2,
    )
    inspector = RuntimeDependencyInspector(settings=settings)
    report = await inspector.inspect()

    assert report.is_ready is False
    assert report.postgres.status == "error"
    assert report.redis.status == "error"
    assert report.opa.status == "error"
    assert "secret_pw" not in (report.postgres.detail or "")
    assert "secret_redis" not in (report.redis.detail or "")
