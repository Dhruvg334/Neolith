"""Platform registry and task CRUD endpoints (/tasks, /agents, /tools, /budgets)."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.core.errors import NeolithAPIError
from neolith_api.core.models import (
    AgentModel,
    AgentVersionModel,
    BudgetModel,
    TaskModel,
    UserModel,
)
from neolith_api.core.telemetry import get_request_trace_id
from neolith_api.financial.schemas import (
    FinancialToolMetadataResponse,
    format_decimal_amount,
)
from neolith_api.financial.service import list_financial_tools
from neolith_api.seed import DEMO_USER_ID, seed_demo_data

router = APIRouter(tags=["registry"])


class CreateTaskRequest(BaseModel):
    """Payload for POST /api/v1/tasks."""

    model_config = ConfigDict(extra="forbid")

    original_request: str = Field(..., min_length=3, max_length=4000)
    objective: str | None = Field(default=None, max_length=1000)
    constraints: dict[str, Any] = Field(default_factory=dict)


class TaskResponse(BaseModel):
    """Response model for Task records."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    user_id: UUID
    original_request: str
    objective: str | None = None
    constraints: dict[str, Any]
    state: str
    trace_id: str | None = None
    created_at: datetime
    updated_at: datetime


class AgentRegistryResponse(BaseModel):
    """Response model for registered AI agents and their active version manifest."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    description: str
    status: str
    active_version: str | None = None
    framework: str | None = None
    artifact_digest: str | None = None
    allowed_tools: list[str] = Field(default_factory=list)
    created_at: datetime


class BudgetRecordResponse(BaseModel):
    """Response model for platform Budget records."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    owner_type: str
    owner_id: str
    currency: str
    limit_amount: str
    approval_threshold: str | None = None
    period_type: str
    status: str
    created_at: datetime


def _to_task_response(model: TaskModel) -> TaskResponse:
    return TaskResponse(
        id=model.id,
        user_id=model.user_id,
        original_request=model.original_request,
        objective=model.objective,
        constraints=model.constraints,
        state=model.state,
        trace_id=model.trace_id,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.get(
    "/tasks",
    response_model=list[TaskResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listTasks",
)
def get_tasks(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[TaskResponse]:
    """List submitted agent tasks ordered newest first."""
    stmt = select(TaskModel).order_by(TaskModel.created_at.desc())
    rows = session.scalars(stmt).all()
    return [_to_task_response(row) for row in rows]


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="createTask",
)
def post_task(
    payload: CreateTaskRequest,
    request: Request,
    session: Annotated[Session, Depends(get_db_session)],
) -> TaskResponse:
    """Create a new financial or platform task record (without executing protected actions)."""
    user = session.get(UserModel, DEMO_USER_ID)
    if user is None:
        user = session.scalars(select(UserModel)).first()
    if user is None:
        seed_demo_data(session, reset=False)
        user = session.get(UserModel, DEMO_USER_ID)
    assert user is not None

    trace_id = get_request_trace_id(request)
    objective = payload.objective or f"Evaluate financial task: {payload.original_request[:120]}"
    task = TaskModel(
        user_id=user.id,
        original_request=payload.original_request.strip(),
        objective=objective,
        constraints=payload.constraints,
        state="planning",
        trace_id=trace_id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_task_response(task)


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getTask",
)
def get_task_by_id(
    task_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> TaskResponse:
    """Retrieve a single task record by UUID."""
    task = session.get(TaskModel, task_id)
    if task is None:
        raise NeolithAPIError(
            status=status.HTTP_404_NOT_FOUND,
            title="Task not found",
            detail=f"Task '{task_id}' does not exist.",
            reason_code="TASK_NOT_FOUND",
        )
    return _to_task_response(task)


@router.get(
    "/agents",
    response_model=list[AgentRegistryResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listAgents",
)
def get_agents(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[AgentRegistryResponse]:
    """List registered AI agents and their active version manifest."""
    agents = session.scalars(select(AgentModel).order_by(AgentModel.name.asc())).all()
    results: list[AgentRegistryResponse] = []
    for agent in agents:
        ver = session.scalars(
            select(AgentVersionModel)
            .where(AgentVersionModel.agent_id == agent.id)
            .order_by(AgentVersionModel.created_at.desc())
        ).first()
        allowed_tools: list[str] = []
        if ver and isinstance(ver.tool_manifest, dict):
            raw_tools = ver.tool_manifest.get("allowed_tools", [])
            if isinstance(raw_tools, list):
                allowed_tools = [str(item) for item in raw_tools]

        results.append(
            AgentRegistryResponse(
                id=agent.id,
                name=agent.name,
                description=agent.description,
                status=agent.status,
                active_version=ver.version if ver else None,
                framework=ver.framework if ver else None,
                artifact_digest=ver.artifact_digest if ver else None,
                allowed_tools=allowed_tools,
                created_at=agent.created_at,
            )
        )
    return results


@router.get(
    "/tools",
    response_model=list[FinancialToolMetadataResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listTools",
)
def get_tools_registry(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[FinancialToolMetadataResponse]:
    """List registered platform and financial agent tools with version metadata."""
    return list_financial_tools(session)


@router.get(
    "/budgets",
    response_model=list[BudgetRecordResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listBudgets",
)
def get_budgets_registry(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[BudgetRecordResponse]:
    """List authoritative platform and category budget limits."""
    rows = session.scalars(
        select(BudgetModel).order_by(BudgetModel.owner_type.asc(), BudgetModel.owner_id.asc())
    ).all()
    return [
        BudgetRecordResponse(
            id=row.id,
            owner_type=row.owner_type,
            owner_id=row.owner_id,
            currency=row.currency,
            limit_amount=format_decimal_amount(Decimal(row.limit_amount)),
            approval_threshold=(
                format_decimal_amount(Decimal(row.approval_threshold))
                if row.approval_threshold is not None
                else None
            ),
            period_type=row.period_type,
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]
