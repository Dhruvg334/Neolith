"""External dependency health inspection for PostgreSQL, Redis, and Open Policy Agent."""

from dataclasses import dataclass
from typing import Literal, Protocol

import httpx
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from neolith_api.core.config import Settings


@dataclass(frozen=True, slots=True)
class DependencyProbeResult:
    """Outcome of a single external dependency readiness probe."""

    status: Literal["ok", "error"]
    detail: str | None = None


@dataclass(frozen=True, slots=True)
class ReadinessReport:
    """Aggregated readiness state across required infrastructure dependencies."""

    postgres: DependencyProbeResult
    redis: DependencyProbeResult
    opa: DependencyProbeResult

    @property
    def is_ready(self) -> bool:
        return (
            self.postgres.status == "ok" and self.redis.status == "ok" and self.opa.status == "ok"
        )


class DependencyInspector(Protocol):
    """Protocol allowing deterministic readiness testing and runtime probing."""

    async def inspect(self) -> ReadinessReport:
        """Probe configured dependencies and return a ReadinessReport."""


class RuntimeDependencyInspector:
    """Probes PostgreSQL, Redis, and OPA using bounded timeouts without leaking secrets."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _probe_postgres_sync(self) -> DependencyProbeResult:
        connect_timeout = max(1, int(self._settings.dependency_timeout_seconds))
        engine = create_engine(
            self._settings.database_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": connect_timeout},
        )
        try:
            with engine.connect() as connection:
                value: object = connection.execute(text("SELECT 1")).scalar_one()
                if value == 1:
                    return DependencyProbeResult(status="ok")
                return DependencyProbeResult(
                    status="error",
                    detail="Unexpected SELECT 1 response from PostgreSQL",
                )
        except (SQLAlchemyError, OSError) as exc:
            return DependencyProbeResult(
                status="error",
                detail=f"PostgreSQL probe failed: {exc.__class__.__name__}",
            )
        finally:
            engine.dispose()

    async def _probe_redis(self) -> DependencyProbeResult:
        client: Redis = Redis.from_url(
            self._settings.redis_url,
            socket_connect_timeout=self._settings.dependency_timeout_seconds,
            socket_timeout=self._settings.dependency_timeout_seconds,
            decode_responses=True,
        )
        try:
            pong = await client.ping()
            if pong is True:
                return DependencyProbeResult(status="ok")
            return DependencyProbeResult(status="error", detail="Unexpected Redis PING response")

        except (RedisError, OSError) as exc:
            return DependencyProbeResult(
                status="error",
                detail=f"Redis probe failed: {exc.__class__.__name__}",
            )
        finally:
            await client.aclose()

    async def _probe_opa(self) -> DependencyProbeResult:
        health_url = f"{self._settings.opa_url}/health"
        try:
            async with httpx.AsyncClient(timeout=self._settings.dependency_timeout_seconds) as http:
                response = await http.get(health_url)
                if response.status_code == 200:
                    return DependencyProbeResult(status="ok")
                return DependencyProbeResult(
                    status="error",
                    detail=f"OPA health endpoint returned HTTP {response.status_code}",
                )
        except (httpx.HTTPError, OSError) as exc:
            return DependencyProbeResult(
                status="error",
                detail=f"OPA probe failed: {exc.__class__.__name__}",
            )

    async def inspect(self) -> ReadinessReport:
        """Inspect PostgreSQL, Redis, and OPA in sequence with bounded timeouts."""
        postgres_result = self._probe_postgres_sync()
        redis_result = await self._probe_redis()
        opa_result = await self._probe_opa()
        return ReadinessReport(
            postgres=postgres_result,
            redis=redis_result,
            opa=opa_result,
        )
