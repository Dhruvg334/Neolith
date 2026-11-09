"""Authoritative Governance Decision Runtime and Profile Evaluation Service."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from neolith_api.core.config import get_settings
from neolith_api.core.models import (
    AgentModel,
    AgentVersionModel,
    BudgetModel,
    SystemStateModel,
    TaskModel,
    ToolModel,
    ToolVersionModel,
    UserModel,
)
from neolith_api.financial.models import (
    BeneficiaryModel,
    FinancialTransactionModel,
    InvoiceModel,
)
from neolith_api.governance.evaluator import (
    OpaPolicyEvaluator,
    PolicyEvaluator,
)
from neolith_api.governance.models import (
    ExecutionRequestModel,
    GovernanceDecisionModel,
    GovernanceProfileModel,
    PermissionBindingModel,
)
from neolith_api.governance.schemas import (
    ActionEvaluationRequest,
    BudgetCheckSummary,
    DecisionOutcome,
    ExecutionRequestRead,
    GovernanceDecisionRead,
    GovernanceProfileCreate,
    GovernanceProfileUpdate,
)


def hash_payload(data: dict[str, Any]) -> str:
    """Compute deterministic SHA-256 digest of arbitrary JSON-compatible dictionary."""
    canonical = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return f"sha256:{hashlib.sha256(canonical.encode('utf-8')).hexdigest()}"


class GovernanceRuntimeService:
    """Orchestrates authoritative evaluation of financial and system action proposals."""

    def __init__(
        self,
        db: Session,
        opa_url: str | None = None,
        evaluator: PolicyEvaluator | None = None,
    ) -> None:
        self.db = db
        if evaluator is not None:
            self.evaluator = evaluator
        else:
            settings = get_settings()
            resolved_opa_url = opa_url or settings.opa_url
            self.evaluator = OpaPolicyEvaluator(
                opa_url=resolved_opa_url,
                decision_path=settings.opa_decision_path,
            )

    # -------------------------------------------------------------------------
    # Governance Profile Management
    # -------------------------------------------------------------------------

    def list_profiles(self) -> list[GovernanceProfileModel]:
        """Return all persisted governance profiles."""
        return list(
            self.db.scalars(
                select(GovernanceProfileModel).order_by(GovernanceProfileModel.name)
            ).all()
        )

    def get_profile(self, profile_id: UUID) -> GovernanceProfileModel | None:
        """Fetch governance profile by UUID."""
        return self.db.get(GovernanceProfileModel, profile_id)

    def get_active_profile(self) -> GovernanceProfileModel:
        """Fetch the currently active governance profile or initialize default Balanced Control."""
        profile = self.db.scalars(
            select(GovernanceProfileModel).where(GovernanceProfileModel.active.is_(True))
        ).first()
        if profile:
            return profile

        # Fallback to balanced profile or first available
        fallback = self.db.scalars(
            select(GovernanceProfileModel).where(GovernanceProfileModel.style == "balanced")
        ).first()
        if fallback:
            fallback.active = True
            self.db.flush()
            return fallback

        # If database not seeded yet, return transient default
        return GovernanceProfileModel(
            id=uuid4(),
            name="Balanced Control",
            style="balanced",
            description=(
                "Default balanced control with approval threshold reviews "
                "and verified beneficiary enforcement."
            ),
            version="1.0.0",
            active=True,
            configuration={
                "require_verified_beneficiary": True,
                "review_threshold": "25000.00",
            },
        )

    def activate_profile(self, profile_id: UUID) -> GovernanceProfileModel:
        """Activate the selected governance profile and deactivate all others."""
        target = self.db.get(GovernanceProfileModel, profile_id)
        if not target:
            raise ValueError(f"Governance profile {profile_id} not found.")

        # Deactivate all profiles
        all_profiles = self.db.scalars(select(GovernanceProfileModel)).all()
        for p in all_profiles:
            p.active = p.id == target.id
        self.db.flush()
        return target

    def create_profile(self, payload: GovernanceProfileCreate) -> GovernanceProfileModel:
        """Create a new custom or template governance profile."""
        new_profile = GovernanceProfileModel(
            id=uuid4(),
            name=payload.name,
            style=payload.style,
            description=payload.description,
            version="1.0.0",
            active=False,
            configuration=payload.configuration,
        )
        self.db.add(new_profile)
        self.db.flush()
        return new_profile

    def update_profile(
        self, profile_id: UUID, payload: GovernanceProfileUpdate
    ) -> GovernanceProfileModel:
        """Update an existing governance profile."""
        profile = self.db.get(GovernanceProfileModel, profile_id)
        if not profile:
            raise ValueError(f"Governance profile {profile_id} not found.")

        if payload.description is not None:
            profile.description = payload.description
        if payload.configuration is not None:
            profile.configuration = payload.configuration
        self.db.flush()
        return profile

    # -------------------------------------------------------------------------
    # Core Action Evaluation Runtime
    # -------------------------------------------------------------------------

    def evaluate_action(self, req: ActionEvaluationRequest) -> GovernanceDecisionRead:
        """Authoritatively evaluate an action proposal through Neolith Governance Runtime."""
        active_profile = self.get_active_profile()

        # 1. Authoritative User Resolution
        user_id = req.user_id
        if not user_id:
            default_user = self.db.scalars(
                select(UserModel).where(UserModel.role == "user")
            ).first()
            user_id = default_user.id if default_user else uuid4()

        # 2. Authoritative Task Resolution
        task_id = req.task_id
        if not task_id:
            task = TaskModel(
                id=uuid4(),
                user_id=user_id,
                original_request=req.operation,
                objective=f"Evaluate {req.operation}",
                state="awaiting_governance",
                trace_id=req.trace_id,
            )
            self.db.add(task)
            self.db.flush()
            task_id = task.id

        # 3. Authoritative Agent & Version Resolution
        agent = self.db.scalars(select(AgentModel).where(AgentModel.name == req.agent_name)).first()
        agent_status = agent.status if agent else "inactive"

        agent_version = None
        if agent:
            agent_version = self.db.scalars(
                select(AgentVersionModel).where(
                    AgentVersionModel.agent_id == agent.id,
                    AgentVersionModel.version == req.agent_version,
                )
            ).first()
        agent_version_valid = agent_version is not None and agent_version.status == "active"

        # 4. Authoritative Tool & Tool Version Resolution
        tool = self.db.scalars(select(ToolModel).where(ToolModel.name == req.tool_name)).first()
        tool_registered = tool is not None
        tool_status = tool.status if tool else "inactive"
        tool_risk_tier = tool.risk_tier if tool else "R4"
        tool_protected = tool.protected if tool else True
        tool_read_only = tool.read_only if tool else False
        tool_req_capability = tool.required_capability if tool else ""

        tool_version = None
        if tool:
            tool_version = self.db.scalars(
                select(ToolVersionModel).where(ToolVersionModel.tool_id == tool.id)
            ).first()

        # 5. Authoritative Permission Binding Resolution
        permission_allowed = False
        if tool:
            candidate_caps = [
                tool_req_capability,
                f"financial:{req.operation}",
                f"financial:{tool.name}",
                f"financial:invoice:{req.operation}",
                f"financial:funds:{req.operation}",
            ]
            binding = self.db.scalars(
                select(PermissionBindingModel).where(
                    PermissionBindingModel.subject_id == req.agent_name,
                    PermissionBindingModel.capability.in_(candidate_caps),
                    PermissionBindingModel.status == "active",
                    PermissionBindingModel.effect == "allow",
                )
            ).first()
            if binding or not tool_protected:
                permission_allowed = True
        elif not tool_protected:
            permission_allowed = True

        # 6. Authoritative Beneficiary Verification
        beneficiary_verified = True
        if req.operation in ("pay_invoice", "transfer_funds"):
            invoice_num = req.parameters.get("invoice_number") or req.resource
            if invoice_num:
                invoice = self.db.scalars(
                    select(InvoiceModel).where(InvoiceModel.invoice_number == invoice_num)
                ).first()
                if invoice:
                    beneficiary_verified = invoice.is_verified_vendor
                    if not req.category and invoice.category:
                        req.category = invoice.category
                    if req.amount is None and invoice.amount:
                        req.amount = invoice.amount
                else:
                    beneficiary_verified = False
            else:
                beneficiary_name = req.parameters.get("vendor_name") or req.parameters.get(
                    "beneficiary"
                )
                if beneficiary_name:
                    ben = self.db.scalars(
                        select(BeneficiaryModel).where(BeneficiaryModel.name == beneficiary_name)
                    ).first()
                    beneficiary_verified = ben.verified if ben else False
                else:
                    beneficiary_verified = False

        # 7. Authoritative Category Budget Check
        budget_summary: BudgetCheckSummary | None = None
        budget_remaining: Decimal | None = None
        budget_threshold: Decimal | None = None

        if req.category:
            budget = self.db.scalars(
                select(BudgetModel).where(
                    BudgetModel.owner_type == "category",
                    BudgetModel.owner_id == req.category,
                )
            ).first()

            if budget:
                spent_result = self.db.scalar(
                    select(
                        func.coalesce(func.sum(FinancialTransactionModel.amount), Decimal("0.00"))
                    ).where(
                        FinancialTransactionModel.category == req.category,
                        FinancialTransactionModel.status == "completed",
                    )
                )
                current_spent = Decimal(spent_result or Decimal("0.00"))
                allocated_limit = budget.limit_amount
                remaining_before = max(Decimal("0.00"), allocated_limit - current_spent)
                req_amount = req.amount or Decimal("0.00")
                remaining_after = remaining_before - req_amount
                budget_remaining = remaining_before
                budget_threshold = budget.approval_threshold

                is_feasible = req_amount <= remaining_before
                exceeds_thresh = budget_threshold is not None and req_amount >= budget_threshold

                budget_summary = BudgetCheckSummary(
                    category=req.category,
                    allocated_limit=allocated_limit,
                    current_spent=current_spent,
                    remaining_before=remaining_before,
                    remaining_after=remaining_after,
                    approval_threshold=budget_threshold,
                    is_feasible=is_feasible,
                    exceeds_threshold=exceeds_thresh,
                )

        # 8. System State / Revocation
        sys_state = self.db.scalars(select(SystemStateModel)).first()
        emergency_stop = sys_state.emergency_stop_active if sys_state else False

        # 9. Evaluate OPA / Policy Engine Authoritatively (Single Policy Authority)
        opa_input: dict[str, Any] = {
            "user": {"id": str(user_id)},
            "agent": {
                "status": agent_status,
                "version_registered": agent_version_valid,
            },
            "task": {
                "blocked_categories": [],
            },
            "permission": {
                "allowed": permission_allowed,
            },
            "action": {
                "operation": req.operation,
                "category": req.category,
                "amount": str(req.amount) if req.amount is not None else None,
            },
            "tool": {
                "allowed": tool_registered and tool_status == "active",
                "registered": tool_registered,
                "status": tool_status,
                "risk_tier": tool_risk_tier,
                "protected": tool_protected,
                "read_only": tool_read_only,
            },
            "beneficiary": {
                "verified": beneficiary_verified,
            },
            "budget": {
                "remaining": str(budget_remaining) if budget_remaining is not None else None,
                "approval_threshold": str(budget_threshold)
                if budget_threshold is not None
                else None,
            },
            "profile": {
                "style": active_profile.style,
                "configuration": active_profile.configuration,
            },
            "risk": {
                "objective_alignment_confidence": 0.95,
            },
            "revocation": {
                "emergency_stop_active": emergency_stop,
            },
        }

        eval_res = self.evaluator.evaluate(opa_input)
        decision: DecisionOutcome = eval_res.decision
        reason_codes = eval_res.reason_codes

        # 10. Persist ExecutionRequest and GovernanceDecision
        action_id = req.action_id or uuid4()
        now = datetime.now(UTC)

        parameters_hash_val = hash_payload(req.parameters)
        context_hash_val = hash_payload(req.context)
        input_hash_val = hash_payload(
            {
                "action_id": str(action_id),
                "trace_id": req.trace_id,
                "operation": req.operation,
                "amount": str(req.amount) if req.amount else None,
                "category": req.category,
                "decision": decision,
                "reason_codes": reason_codes,
            }
        )

        agent_version_id = agent_version.id if agent_version else uuid4()
        tool_version_id = tool_version.id if tool_version else uuid4()

        execution_request = ExecutionRequestModel(
            id=action_id,
            trace_id=req.trace_id,
            task_id=task_id,
            user_id=user_id,
            agent_version_id=agent_version_id,
            tool_version_id=tool_version_id,
            operation=req.operation,
            resource=req.resource,
            category=req.category,
            amount=req.amount,
            currency=req.currency,
            parameters=req.parameters,
            parameters_hash=parameters_hash_val,
            context_payload=req.context,
            context_hash=context_hash_val,
            nonce=f"nonce-{uuid4().hex[:16]}",
            state=decision,
            requested_at=now,
            created_at=now,
        )
        self.db.add(execution_request)
        self.db.flush()

        decision_record = GovernanceDecisionModel(
            id=uuid4(),
            action_id=action_id,
            outcome=decision,
            permission_result={"allowed": permission_allowed, "capability": tool_req_capability},
            reason_codes=reason_codes,
            risk_tier=tool_risk_tier,
            policy_version_ids=["policy:neolith-core:v1"],
            policy_bundle_digest="digest:neolith-policy-bundle-sha256",
            profile_id=active_profile.id,
            profile_version=active_profile.version,
            budget_check=budget_summary.model_dump(mode="json") if budget_summary else None,
            tool_metadata={
                "name": req.tool_name,
                "risk_tier": tool_risk_tier,
                "protected": tool_protected,
                "read_only": tool_read_only,
            },
            input_hash=input_hash_val,
            created_at=now,
        )
        self.db.add(decision_record)
        self.db.flush()

        # Update task state
        persisted_task = self.db.get(TaskModel, task_id)
        if persisted_task:
            if decision == "allow":
                persisted_task.state = "ready_to_execute"
            elif decision == "review":
                persisted_task.state = "awaiting_approval"
            else:
                persisted_task.state = "denied"
            self.db.flush()

        return GovernanceDecisionRead(
            action_id=action_id,
            trace_id=req.trace_id,
            decision=decision,
            reason_codes=reason_codes,
            risk_tier=tool_risk_tier,
            profile_id=active_profile.id,
            profile_name=active_profile.name,
            profile_style=active_profile.style,
            profile_version=active_profile.version,
            budget_check=budget_summary,
            tool_metadata={
                "name": req.tool_name,
                "risk_tier": tool_risk_tier,
                "protected": tool_protected,
                "read_only": tool_read_only,
            },
            created_at=now,
        )

    def get_decision(self, action_id: UUID) -> GovernanceDecisionRead | None:
        """Fetch evaluated governance decision for a specific action ID."""
        rec = self.db.scalars(
            select(GovernanceDecisionModel).where(GovernanceDecisionModel.action_id == action_id)
        ).first()
        if not rec:
            return None
        exec_req = self.db.get(ExecutionRequestModel, action_id)
        trace_id = exec_req.trace_id if exec_req else "unknown"
        profile_name = "Balanced Control"
        profile_style = "balanced"
        if rec.profile_id:
            prof = self.db.get(GovernanceProfileModel, rec.profile_id)
            if prof:
                profile_name = prof.name
                profile_style = prof.style
        budget_summary = BudgetCheckSummary(**rec.budget_check) if rec.budget_check else None
        decision_outcome = cast(DecisionOutcome, rec.outcome)
        return GovernanceDecisionRead(
            action_id=rec.action_id,
            trace_id=trace_id,
            decision=decision_outcome,
            reason_codes=rec.reason_codes,
            risk_tier=rec.risk_tier,
            profile_id=rec.profile_id,
            profile_name=profile_name,
            profile_style=profile_style,
            profile_version=rec.profile_version or "1.0.0",
            budget_check=budget_summary,
            tool_metadata=rec.tool_metadata or {},
            created_at=rec.created_at,
        )

    def list_decisions(
        self, limit: int = 50, outcome: str | None = None
    ) -> list[GovernanceDecisionRead]:
        """List recent evaluated governance decisions."""
        stmt = select(GovernanceDecisionModel).order_by(GovernanceDecisionModel.created_at.desc())
        if outcome:
            stmt = stmt.where(GovernanceDecisionModel.outcome == outcome)
        stmt = stmt.limit(limit)
        records = self.db.scalars(stmt).all()
        results: list[GovernanceDecisionRead] = []
        for rec in records:
            d = self.get_decision(rec.action_id)
            if d:
                results.append(d)
        return results

    def get_execution_request(self, action_id: UUID) -> ExecutionRequestRead | None:
        """Fetch execution request and its attached decision by action ID."""
        exec_req = self.db.get(ExecutionRequestModel, action_id)
        if not exec_req:
            return None
        decision = self.get_decision(action_id)
        return ExecutionRequestRead(
            action_id=exec_req.id,
            trace_id=exec_req.trace_id,
            task_id=exec_req.task_id,
            user_id=exec_req.user_id,
            operation=exec_req.operation,
            resource=exec_req.resource,
            category=exec_req.category,
            amount=exec_req.amount,
            currency=exec_req.currency,
            parameters=exec_req.parameters,
            state=exec_req.state,
            requested_at=exec_req.requested_at,
            created_at=exec_req.created_at,
            decision=decision,
        )
