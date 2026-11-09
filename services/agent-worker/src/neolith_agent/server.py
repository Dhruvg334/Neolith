"""Internal HTTP service entry point for the Financial AI Agent worker (Part D)."""

from fastapi import FastAPI, status
from pydantic import BaseModel

from neolith_agent.agent import FinancialAIAgent
from neolith_agent.interfaces import InteractionTurn, InterfaceResponse


class WorkerHealthResponse(BaseModel):
    """Worker service health status."""

    status: str
    service: str = "neolith-agent-worker"


def create_agent_worker_app(agent: FinancialAIAgent | None = None) -> FastAPI:
    """Create the internal FastAPI application for the agent worker."""
    app = FastAPI(
        title="Neolith Financial Agent Worker",
        description="Internal LangGraph worker executing financial understanding and proposals.",
        version="0.1.0",
    )
    agent_instance = agent or FinancialAIAgent()

    @app.get("/health", response_model=WorkerHealthResponse)
    async def get_health() -> WorkerHealthResponse:
        return WorkerHealthResponse(status="healthy")

    @app.post(
        "/internal/v1/turns",
        response_model=InterfaceResponse,
        status_code=status.HTTP_200_OK,
    )
    async def process_turn(turn: InteractionTurn) -> InterfaceResponse:
        """Execute a conversational interaction turn through the stateful Financial AI Agent."""
        return await agent_instance.process_turn(turn)

    return app


app = create_agent_worker_app()
