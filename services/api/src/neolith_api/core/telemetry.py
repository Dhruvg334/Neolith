"""OpenTelemetry-ready trace correlation helpers."""

import uuid

from fastapi import Request
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider

_TELEMETRY_CONFIGURED = False


def configure_telemetry(service_name: str, service_version: str) -> None:
    """Initialise an OpenTelemetry TracerProvider without requiring a live collector."""
    global _TELEMETRY_CONFIGURED
    if _TELEMETRY_CONFIGURED:
        return

    resource = Resource.create(
        {
            "service.name": service_name,
            "service.version": service_version,
        }
    )
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)
    _TELEMETRY_CONFIGURED = True


def get_tracer(name: str = "neolith_api") -> trace.Tracer:
    """Return an OpenTelemetry tracer instance."""
    return trace.get_tracer(name)


def resolve_trace_id(incoming_header: str | None = None) -> str:
    """Return a valid trace identifier from header, active OTel span, or new UUIDv4 hex."""
    if incoming_header and len(incoming_header.strip()) >= 8:
        return incoming_header.strip()

    span = trace.get_current_span()
    span_context = span.get_span_context()
    if span_context and span_context.is_valid:
        return f"{span_context.trace_id:032x}"

    return uuid.uuid4().hex


def get_request_trace_id(request: Request) -> str:
    """Retrieve the trace ID assigned to the current request state."""
    existing = getattr(request.state, "trace_id", None)
    if isinstance(existing, str) and existing:
        return existing
    resolved = resolve_trace_id(request.headers.get("X-Trace-Id"))
    request.state.trace_id = resolved
    return resolved
