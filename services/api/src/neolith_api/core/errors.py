"""RFC 9457 / 7807 problem-detail error models and handlers."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from neolith_api.core.telemetry import get_request_trace_id

PROBLEM_MEDIA_TYPE = "application/problem+json"


class ProblemDetail(BaseModel):
    """Structured error response matching specs/openapi.yaml#/components/schemas/Problem."""

    type: str
    title: str
    status: int
    detail: str
    reason_code: str | None = None
    trace_id: str | None = None


class NeolithAPIError(Exception):
    """Domain/API exception producing an RFC problem-detail payload."""

    def __init__(
        self,
        *,
        status: int,
        title: str,
        detail: str,
        reason_code: str | None = None,
        error_type: str = "about:blank",
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.title = title
        self.detail = detail
        self.reason_code = reason_code
        self.error_type = error_type


def register_exception_handlers(app: FastAPI) -> None:
    """Attach structured problem+json exception handlers to the FastAPI app."""

    @app.exception_handler(NeolithAPIError)
    async def handle_neolith_error(request: Request, exc: NeolithAPIError) -> JSONResponse:
        trace_id = get_request_trace_id(request)
        problem = ProblemDetail(
            type=exc.error_type,
            title=exc.title,
            status=exc.status,
            detail=exc.detail,
            reason_code=exc.reason_code,
            trace_id=trace_id,
        )
        return JSONResponse(
            status_code=exc.status,
            content=problem.model_dump(exclude_none=True),
            media_type=PROBLEM_MEDIA_TYPE,
            headers={"X-Trace-Id": trace_id},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        trace_id = get_request_trace_id(request)
        problem = ProblemDetail(
            type="https://neolith.local/problems/validation-error",
            title="Request validation failed",
            status=422,
            detail=f"Validation failed with {len(exc.errors())} error(s).",
            reason_code="REQUEST_VALIDATION_FAILED",
            trace_id=trace_id,
        )
        return JSONResponse(
            status_code=422,
            content=problem.model_dump(exclude_none=True),
            media_type=PROBLEM_MEDIA_TYPE,
            headers={"X-Trace-Id": trace_id},
        )
