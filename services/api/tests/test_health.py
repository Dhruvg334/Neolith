"""Tests for GET /api/v1/health liveness and trace correlation."""

import pytest
from httpx import ASGITransport, AsyncClient

from neolith_api.core.config import Settings
from neolith_api.main import create_app


@pytest.mark.asyncio
async def test_health_endpoint_returns_expected_structure() -> None:
    """GET /api/v1/health returns status ok, service name, version, and trace header."""
    settings = Settings(APP_ENV="test", LLM_API_KEY="")
    app = create_app(settings=settings)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "neolith-api",
        "version": "0.1.0",
    }
    assert "X-Trace-Id" in response.headers
    assert len(response.headers["X-Trace-Id"]) >= 8


@pytest.mark.asyncio
async def test_health_endpoint_propagates_valid_trace_header() -> None:
    """GET /api/v1/health preserves a valid caller-supplied X-Trace-Id header."""
    app = create_app(settings=Settings(APP_ENV="test"))
    custom_trace_id = "trace-phase0-health-001"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"X-Trace-Id": custom_trace_id},
        )

    assert response.status_code == 200
    assert response.headers["X-Trace-Id"] == custom_trace_id
