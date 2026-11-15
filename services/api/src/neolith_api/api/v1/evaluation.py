"""Evaluation and Assurance Lab endpoints (F15)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.evaluation.models import (
    EvaluationCaseModel,
    EvaluationResultModel,
    EvaluationRunModel,
)
from neolith_api.evaluation.schemas import (
    EvaluationCaseResult,
    EvaluationRunResponse,
    EvaluationScenarioSummary,
)
from neolith_api.evaluation.service import EvaluationService

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get(
    "/scenarios",
    response_model=list[EvaluationScenarioSummary],
    status_code=status.HTTP_200_OK,
    operation_id="listEvaluationScenarios",
)
def list_evaluation_scenarios(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[EvaluationScenarioSummary]:
    """List canonical evaluation scenarios in the Neolith Assurance Lab."""
    service = EvaluationService(session)
    return service.list_scenarios()


@router.post(
    "/runs",
    response_model=EvaluationRunResponse,
    status_code=status.HTTP_200_OK,
    operation_id="createEvaluationRun",
)
def create_evaluation_run(
    session: Annotated[Session, Depends(get_db_session)],
) -> EvaluationRunResponse:
    """Execute all 7 canonical assurance lab scenarios and record results (F15).

    Tests:
    1. Happy path invoice payment (INV-001 -> ALLOW)
    2. Over-budget unverified invoice (INV-003 -> DENY with dual reason codes)
    3. Malicious prompt injection defense (untrusted instructions cannot expand authority)
    4. Execution permit single-use enforcement (PERMIT_REPLAY rejection)
    5. Parameter tampering detection (PARAMETER_HASH_MISMATCH detection)
    6. Category budget ceiling enforcement under concurrency
    7. Global emergency stop and revocation epoch mismatch enforcement
    """
    service = EvaluationService(session)
    return service.run_suite()


@router.get(
    "/runs",
    response_model=list[EvaluationRunResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listEvaluationRuns",
)
def list_evaluation_runs(
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[EvaluationRunResponse]:
    """List recent evaluation runs and their execution summaries."""
    runs = session.scalars(
        select(EvaluationRunModel).order_by(EvaluationRunModel.created_at.desc()).limit(limit)
    ).all()

    responses: list[EvaluationRunResponse] = []
    for run in runs:
        results = session.scalars(
            select(EvaluationResultModel).where(EvaluationResultModel.run_id == run.id)
        ).all()
        case_results: list[EvaluationCaseResult] = []
        for res in results:
            case = session.get(EvaluationCaseModel, res.case_id)
            case_results.append(
                EvaluationCaseResult(
                    external_id=case.external_id if case else "unknown",
                    title=case.title if case else "unknown",
                    passed=res.passed,
                    latency_ms=res.latency_ms or 0,
                    expected_decision=str(case.expected.get("governance_decision", "allow"))
                    if case
                    else "allow",
                    actual_decision=str(res.actual.get("decision", "unknown")),
                    actual_reason_codes=list(res.actual.get("reason_codes", [])),
                    failure_reason=res.failure_reason,
                    details=res.actual,
                )
            )

        passed_count = sum(1 for r in case_results if r.passed)
        responses.append(
            EvaluationRunResponse(
                run_id=run.id,
                suite_name="Neolith Assurance Lab Core",
                state=run.state,
                scenarios_total=len(case_results),
                scenarios_passed=passed_count,
                scenarios_failed=len(case_results) - passed_count,
                duration_ms=sum(r.latency_ms for r in case_results),
                results=case_results,
                created_at=run.created_at,
            )
        )
    return responses


@router.get(
    "/runs/{run_id}",
    response_model=EvaluationRunResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getEvaluationRun",
)
def get_evaluation_run(
    run_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> EvaluationRunResponse:
    """Retrieve detailed results for a specific evaluation run."""
    run = session.get(EvaluationRunModel, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation run '{run_id}' not found.",
        )
    results = session.scalars(
        select(EvaluationResultModel).where(EvaluationResultModel.run_id == run.id)
    ).all()
    case_results: list[EvaluationCaseResult] = []
    for res in results:
        case = session.get(EvaluationCaseModel, res.case_id)
        case_results.append(
            EvaluationCaseResult(
                external_id=case.external_id if case else "unknown",
                title=case.title if case else "unknown",
                passed=res.passed,
                latency_ms=res.latency_ms or 0,
                expected_decision=str(case.expected.get("governance_decision", "allow"))
                if case
                else "allow",
                actual_decision=str(res.actual.get("decision", "unknown")),
                actual_reason_codes=list(res.actual.get("reason_codes", [])),
                failure_reason=res.failure_reason,
                details=res.actual,
            )
        )

    passed_count = sum(1 for r in case_results if r.passed)
    return EvaluationRunResponse(
        run_id=run.id,
        suite_name="Neolith Assurance Lab Core",
        state=run.state,
        scenarios_total=len(case_results),
        scenarios_passed=passed_count,
        scenarios_failed=len(case_results) - passed_count,
        duration_ms=sum(r.latency_ms for r in case_results),
        results=case_results,
        created_at=run.created_at,
    )
