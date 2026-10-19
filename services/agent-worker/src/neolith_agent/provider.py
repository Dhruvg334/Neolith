"""Provider-pluggable LLM adapter interface and deterministic CI mock provider (D-012)."""

from typing import Any, Protocol


class LLMProviderAdapter(Protocol):
    """Vendor-neutral model adapter contract."""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a structured JSON response conforming to response_schema."""


class DeterministicMockLLMProvider:
    """Deterministic model provider used in CI and offline evaluation suites."""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        _ = (system_prompt, response_schema)
        return {
            "objective": "Select project-management software",
            "recommended_vendor": "taskforge",
            "user_prompt_length": len(user_prompt),
        }
