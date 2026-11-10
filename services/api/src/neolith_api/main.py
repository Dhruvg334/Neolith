"""FastAPI application entrypoint for Neolith control plane and runtime API."""

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from neolith_api.api.v1.actions import router as actions_router
from neolith_api.api.v1.approvals import router as approvals_router
from neolith_api.api.v1.elevenlabs import router as elevenlabs_router
from neolith_api.api.v1.financial import router as financial_router
from neolith_api.api.v1.governance import router as governance_router
from neolith_api.api.v1.health import router as health_router
from neolith_api.api.v1.interactions import router as interactions_router
from neolith_api.api.v1.receipts import router as receipts_router
from neolith_api.api.v1.registry import router as registry_router
from neolith_api.api.v1.twilio import router as twilio_router
from neolith_api.core.config import Settings, get_settings
from neolith_api.core.errors import register_exception_handlers
from neolith_api.core.telemetry import configure_telemetry, get_request_trace_id, get_tracer


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the Neolith FastAPI application."""
    active_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        configure_telemetry(
            service_name=active_settings.otel_service_name,
            service_version=active_settings.service_version,
        )
        yield

    app = FastAPI(
        title="Neolith API",
        version=active_settings.service_version,
        description="Agentic decision and governed execution API.",
        lifespan=lifespan,
    )
    app.state.settings = active_settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def trace_correlation_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        tracer = get_tracer("neolith_api.http")
        with tracer.start_as_current_span(f"{request.method} {request.url.path}") as span:
            trace_id = get_request_trace_id(request)
            span.set_attribute("neolith.trace_id", trace_id)
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.route", request.url.path)
            response = await call_next(request)
            response.headers["X-Trace-Id"] = trace_id
            return response

    register_exception_handlers(app)
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(financial_router, prefix="/api/v1")
    app.include_router(registry_router, prefix="/api/v1")
    app.include_router(interactions_router, prefix="/api/v1")
    app.include_router(actions_router, prefix="/api/v1")
    app.include_router(approvals_router, prefix="/api/v1")
    app.include_router(governance_router, prefix="/api/v1")
    app.include_router(receipts_router, prefix="/api/v1")
    app.include_router(twilio_router, prefix="/api/v1")
    app.include_router(elevenlabs_router)
    return app


app = create_app()
