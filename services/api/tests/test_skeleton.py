"""Tests for domain module skeletons, canonical hashing, and mock LLM provider."""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from neolith_agent.provider import DeterministicMockLLMProvider
from neolith_agent.state import ActionProposal, AgentWorkflowState
from neolith_api.actions import ExecutionRequestEnvelopeSchema
from neolith_api.budgets import BudgetSchema
from neolith_api.core.security import canonicalize_json, compute_sha256_prefixed
from neolith_api.policies import OPADecisionResult
from neolith_simulator.procurement import SimulatedSubscriptionResult


def test_canonical_json_hashing_is_key_order_independent() -> None:
    """canonicalize_json and compute_sha256_prefixed are key-order independent."""
    first = {"vendor": "taskforge", "amount": "6000.00", "seats": 10}

    second = {"seats": 10, "vendor": "taskforge", "amount": "6000.00"}

    assert canonicalize_json(first) == canonicalize_json(second)
    digest = compute_sha256_prefixed(first)
    assert digest.startswith("sha256:")
    assert len(digest) == 71
    assert digest == compute_sha256_prefixed(second)


def test_domain_skeleton_schemas_validate_correctly() -> None:
    """Core skeleton schemas across API, agent-worker, and tool-simulator validate."""
    now = datetime.now(UTC)
    params = {"vendor": "taskforge", "seats": 10}
    ctx = {"department": "engineering"}

    envelope = ExecutionRequestEnvelopeSchema(
        action_id=uuid4(),
        trace_id="trace-skeleton-0001",
        task_id=uuid4(),
        user_id=uuid4(),
        agent_id=uuid4(),
        agent_version="0.1.0",
        tool_id=uuid4(),
        operation="procure_subscription",
        amount="6000.00",
        currency="INR",
        parameters=params,
        parameters_hash=compute_sha256_prefixed(params),
        context=ctx,
        context_hash=compute_sha256_prefixed(ctx),
        requested_at=now,
        nonce="nonce-skeleton-0123456789",
    )
    assert envelope.operation == "procure_subscription"

    budget = BudgetSchema(
        id=uuid4(),
        owner_type="project",
        owner_id="proj-pm-software",
        currency="INR",
        limit_amount=Decimal("8000.00"),
        approval_threshold=Decimal("7000.00"),
        period_type="month",
        created_at=now,
    )
    assert budget.limit_amount == Decimal("8000.00")

    decision = OPADecisionResult(
        decision="allow",
        reason_codes=["BASE_POLICY_ALLOW"],
        required_approvals=[],
        risk_tier="R2",
    )
    assert decision.decision == "allow"

    proposal = ActionProposal(
        purpose="Procure TaskForge subscription for 10 seats",
        tool="procurement_service",
        operation="procure_subscription",
        parameters=params,
        amount="6000.00",
        currency="INR",
        evidence_ids=["taskforge"],
    )
    workflow_state = AgentWorkflowState(
        task_id=envelope.task_id,
        user_id=envelope.user_id,
        trace_id=envelope.trace_id,
        raw_request="Need project management software under 8000 INR",
        proposal=proposal,
    )
    assert workflow_state.proposal is not None

    sim = SimulatedSubscriptionResult(
        subscription_id=uuid4(),
        action_id=envelope.action_id,
        permit_id=uuid4(),
        vendor_id="taskforge",
        amount="6000.00",
        currency="INR",
        seats=10,
    )
    assert sim.mode == "success"


@pytest.mark.asyncio
async def test_deterministic_mock_llm_provider() -> None:
    """DeterministicMockLLMProvider returns reproducible structured output without API keys."""
    provider = DeterministicMockLLMProvider()
    result = await provider.generate_structured(
        system_prompt="System prompt",
        user_prompt="Find software",
        response_schema={"type": "object"},
    )
    assert result["recommended_vendor"] == "taskforge"
