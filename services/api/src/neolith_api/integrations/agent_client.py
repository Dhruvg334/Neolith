"""Adapter client for communicating with the internal Financial Agent worker (Part D)."""

import os
from typing import Any

import httpx

from neolith_agent.agent import FinancialAIAgent
from neolith_agent.interfaces import InteractionTurn, InterfaceResponse


class AgentWorkerClient:
    """Client for dispatching interaction turns to the internal Financial Agent service."""

    def __init__(
        self,
        worker_url: str | None = None,
        client: httpx.AsyncClient | None = None,
        in_process_agent: FinancialAIAgent | None = None,
    ) -> None:
        raw_url = worker_url or os.getenv("NEOLITH_AGENT_WORKER_URL") or "http://localhost:8010"
        self.worker_url = raw_url.rstrip("/")
        self._client = client
        self._in_process_agent = in_process_agent

    async def process_turn(self, turn: InteractionTurn) -> InterfaceResponse:
        """Forward an InteractionTurn to the worker service or in-process agent."""
        if self._in_process_agent is not None:
            return await self._in_process_agent.process_turn(turn)

        turn_dict = turn.model_dump(mode="json")

        if self._client is not None:
            resp = await self._client.post(f"{self.worker_url}/internal/v1/turns", json=turn_dict)
            resp.raise_for_status()
            data: dict[str, Any] = resp.json()
            return InterfaceResponse.model_validate(data)

        # In offline deployment or local unit tests where worker daemon is not enabled,
        # run through the in-process Financial AI Agent directly.
        if os.getenv("NEOLITH_USE_INTERNAL_WORKER", "").lower() not in ("1", "true"):
            fallback_agent = FinancialAIAgent()
            return await fallback_agent.process_turn(turn)

        try:
            timeout_cfg = httpx.Timeout(10.0, connect=0.5)
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                resp = await client.post(f"{self.worker_url}/internal/v1/turns", json=turn_dict)
                resp.raise_for_status()
                data = resp.json()
                return InterfaceResponse.model_validate(data)
        except Exception:
            fallback_agent = FinancialAIAgent()
            return await fallback_agent.process_turn(turn)
