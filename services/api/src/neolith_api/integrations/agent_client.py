"""Adapter client for communicating with the internal Financial Agent worker (Part D)."""

import os
from typing import Any

import httpx

from neolith_agent.agent import FinancialAIAgent
from neolith_agent.interfaces import InteractionTurn, InterfaceResponse


class AgentWorkerUnavailableError(Exception):
    """Raised when worker execution is requested but the worker service is unreachable."""


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
        """Forward an InteractionTurn to the worker service or in-process agent
        based on NEOLITH_AGENT_EXECUTION_MODE.
        """
        if self._in_process_agent is not None:
            return await self._in_process_agent.process_turn(turn)

        execution_mode = (
            os.getenv("NEOLITH_AGENT_EXECUTION_MODE")
            or (
                "worker"
                if os.getenv("NEOLITH_USE_INTERNAL_WORKER", "").lower() in ("1", "true")
                else "in_process"
            )
        ).lower()

        if execution_mode == "in_process":
            agent = FinancialAIAgent()
            return await agent.process_turn(turn)

        # Explicit 'worker' execution mode: forward over HTTP with zero silent fallback
        turn_dict = turn.model_dump(mode="json")
        try:
            if self._client is not None:
                resp = await self._client.post(
                    f"{self.worker_url}/internal/v1/turns", json=turn_dict
                )
                resp.raise_for_status()
                data: dict[str, Any] = resp.json()
                return InterfaceResponse.model_validate(data)

            timeout_cfg = httpx.Timeout(10.0, connect=1.0)
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                resp = await client.post(f"{self.worker_url}/internal/v1/turns", json=turn_dict)
                resp.raise_for_status()
                data = resp.json()
                return InterfaceResponse.model_validate(data)
        except Exception as err:
            raise AgentWorkerUnavailableError(
                f"Agent worker service at '{self.worker_url}' is unavailable: {err}"
            ) from err
