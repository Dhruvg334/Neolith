"""Idempotency contract definitions for protected write operations."""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class IdempotencyRecord:
    """Stored idempotency state binding a key to a canonical request hash and response."""

    idempotency_key: str
    request_hash: str
    status_code: int
    response_body: str


class IdempotencyStore(Protocol):
    """Protocol for checking and storing idempotent request results."""

    async def get(self, key: str) -> IdempotencyRecord | None:
        """Retrieve an existing idempotency record by key."""

    async def put(self, record: IdempotencyRecord, ttl_seconds: int = 86400) -> bool:
        """Store an idempotency record if the key does not already exist."""
