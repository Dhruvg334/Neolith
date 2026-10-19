"""Enterprise service adapter and MCP connector interfaces (F10)."""

from typing import Any, Protocol


class ProtectedServiceAdapter(Protocol):
    """Protocol for protected enterprise service adapters enforcing permit verification."""

    async def execute_permitted_action(
        self,
        *,
        permit_token: str,
        idempotency_key: str,
        operation: str,
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
        """Verify permit, consume nonce, and execute the enterprise operation."""
