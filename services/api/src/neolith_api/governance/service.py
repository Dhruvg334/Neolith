"""Authoritative Governance Decision Runtime and Profile Evaluation Service."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from neolith_api.approvals import (
    ApprovalDecisionResponse,
    ApprovalEnrichedRead,
    ApprovalState,
)
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
    FinancialAccountModel,
    FinancialTransactionModel,
    InvoiceModel,
)
from neolith_api.governance.evaluator import (
    OpaPolicyEvaluator,
    PolicyEvaluator,
)
from neolith_api.governance.models import (
    ApprovalModel,
    DecisionReceiptModel,
    ExecutionPermitModel,
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
from neolith_api.receipts import (
    DecisionReceiptSchema,
    ReceiptEventType,
    ReceiptVerificationResponse,
)


def hash_payload(data: dict[str, Any]) -> str:
    """Compute deterministic SHA-256 digest of arbitrary JSON-compatible dictionary."""
    canonical = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return f"sha256:{hashlib.sha256(canonical.encode('utf-8')).hexdigest()}"


def compute_receipt_hash(
    previous_hash: str | None,
    chain_index: int,
    payload_hash: str,
    event_type: str,
) -> str:
    """Compute cryptographic hash linking this receipt to previous receipt in chain (F13)."""
    prev = previous_hash if previous_hash else ("0" * 64)
    data = f"{prev}:{chain_index}:{payload_hash}:{event_type}"
    return f"sha256:{hashlib.sha256(data.encode('utf-8')).hexdigest()}"


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

        # 11. Append Append-Only Decision Receipt and Trigger Permitting / Human Checkpoints
        self.append_decision_receipt(
            action_id=action_id,
            event_type="decision",
            payload={
                "action_id": str(action_id),
                "outcome": decision,
                "reason_codes": reason_codes,
                "risk_tier": tool_risk_tier,
                "operation": req.operation,
                "amount": str(req.amount) if req.amount else None,
                "category": req.category,
            },
        )

        if decision == "review":
            # Create human approval checkpoint (F08)
            existing_appr = self.db.scalars(
                select(ApprovalModel).where(ApprovalModel.action_id == action_id)
            ).first()
            if not existing_appr:
                approval = ApprovalModel(
                    id=uuid4(),
                    action_id=action_id,
                    action_hash=parameters_hash_val,
                    required_role="approver",
                    state="pending",
                    expires_at=now + timedelta(days=1),
                    created_at=now,
                )
                self.db.add(approval)
                self.db.flush()

        elif decision == "allow":
            # Issue Execution Permit (F09)
            permit = self.issue_execution_permit(action_id=action_id)
            self.append_decision_receipt(
                action_id=action_id,
                event_type="permit_issued",
                payload={
                    "permit_id": str(permit.id),
                    "action_id": str(action_id),
                    "nonce": permit.nonce,
                    "audience": permit.audience,
                    "expires_at": permit.expires_at.isoformat(),
                },
            )

            # Settle immediately if pay_invoice (F10)
            if req.operation == "pay_invoice":
                tx = self.execute_settlement(action_id, permit)
                if tx:
                    self.append_decision_receipt(
                        action_id=action_id,
                        event_type="execution",
                        payload={
                            "transaction_id": str(tx.id),
                            "action_id": str(action_id),
                            "amount": str(tx.amount),
                            "currency": tx.currency,
                            "reference": tx.reference,
                            "completed_at": datetime.now(UTC).isoformat(),
                        },
                    )

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

    # -------------------------------------------------------------------------
    # F09 Execution Permit Issuance & F10 Banking Settlement
    # -------------------------------------------------------------------------

    def issue_execution_permit(
        self,
        action_id: UUID,
        reservation_id: UUID | None = None,
    ) -> ExecutionPermitModel:
        """Issue a short-lived, single-use Execution Permit for an approved action (F09)."""
        existing = self.db.scalars(
            select(ExecutionPermitModel).where(ExecutionPermitModel.action_id == action_id)
        ).first()
        if existing:
            return existing

        now = datetime.now(UTC)
        nonce = f"nonce-{uuid4().hex}"
        token_hash = hash_payload(
            {"action_id": str(action_id), "nonce": nonce, "issued_at": now.isoformat()}
        )
        sys_state = self.db.scalars(select(SystemStateModel)).first()
        epoch = int(sys_state.revocation_epoch) if sys_state else 0

        permit = ExecutionPermitModel(
            id=uuid4(),
            action_id=action_id,
            reservation_id=reservation_id,
            token_hash=token_hash,
            nonce=nonce,
            audience="neolith:tool-simulator",
            revocation_epoch=epoch,
            state="issued",
            issued_at=now,
            not_before=now,
            expires_at=now + timedelta(minutes=15),
        )
        self.db.add(permit)
        self.db.flush()
        return permit

    def execute_settlement(
        self,
        action_id: UUID,
        permit: ExecutionPermitModel,
    ) -> FinancialTransactionModel | None:
        """Execute banking settlement and ledger updates for an allowed or approved payment.

        Fulfills F10 Banking Settlement.
        """
        exec_req = self.db.get(ExecutionRequestModel, action_id)
        if not exec_req or exec_req.operation != "pay_invoice":
            return None

        # Resolve invoice
        invoice_num = exec_req.parameters.get("invoice_number") or exec_req.resource
        invoice: InvoiceModel | None = None
        if invoice_num:
            invoice = self.db.scalars(
                select(InvoiceModel).where(InvoiceModel.invoice_number == invoice_num)
            ).first()

        if not invoice:
            return None

        # Idempotency check: if transaction already exists for this action, return it
        existing_tx = self.db.scalars(
            select(FinancialTransactionModel).where(
                FinancialTransactionModel.idempotency_key == f"settlement:{action_id}"
            )
        ).first()
        if existing_tx:
            return existing_tx

        # Resolve primary operating financial account
        account = self.db.scalars(
            select(FinancialAccountModel).order_by(FinancialAccountModel.created_at.asc())
        ).first()
        if not account:
            return None

        now = datetime.now(UTC)
        # 1. Update invoice status to 'paid'
        invoice.status = "paid"
        invoice.updated_at = now

        # 2. Debit available balance
        account.available_balance = Decimal(str(account.available_balance)) - Decimal(
            str(invoice.amount)
        )
        account.updated_at = now

        # 3. Insert transaction
        tx = FinancialTransactionModel(
            id=uuid4(),
            transaction_type="invoice_payment",
            account_id=account.id,
            invoice_id=invoice.id,
            beneficiary_id=invoice.vendor_id,
            category=invoice.category,
            amount=invoice.amount,
            currency=invoice.currency,
            status="completed",
            reference=f"PAY-{invoice.invoice_number} — Settled via Execution Permit",
            idempotency_key=f"settlement:{action_id}",
            completed_at=now,
        )
        self.db.add(tx)

        # 4. Consume permit
        permit.state = "consumed"
        permit.consumed_at = now

        # 5. Update execution request state
        exec_req.state = "executed"

        # 6. Update task state if linked
        if exec_req.task_id:
            task = self.db.get(TaskModel, exec_req.task_id)
            if task:
                task.state = "completed"

        self.db.flush()
        return tx

    # -------------------------------------------------------------------------
    # F08 Human Approvals
    # -------------------------------------------------------------------------

    def _enrich_approval(self, approval: ApprovalModel) -> ApprovalEnrichedRead:
        """Enrich ApprovalModel with execution request, invoice, and governance details."""
        exec_req = self.db.get(ExecutionRequestModel, approval.action_id)
        operation = exec_req.operation if exec_req else "unknown"
        resource = exec_req.resource if exec_req else None
        amount = exec_req.amount if exec_req else None
        currency = exec_req.currency if exec_req else "INR"
        category = exec_req.category if exec_req else None
        vendor_name: str | None = None
        description: str | None = None
        is_verified_vendor = False

        if resource:
            invoice = self.db.scalars(
                select(InvoiceModel).where(InvoiceModel.invoice_number == resource)
            ).first()
            if invoice:
                vendor_name = invoice.vendor_name
                description = invoice.description
                is_verified_vendor = invoice.is_verified_vendor
                if not amount:
                    amount = invoice.amount
                if not category:
                    category = invoice.category

        if not vendor_name and exec_req:
            vendor_name = exec_req.parameters.get("vendor_name")

        gov_decision = self.db.scalars(
            select(GovernanceDecisionModel).where(
                GovernanceDecisionModel.action_id == approval.action_id
            )
        ).first()
        outcome = gov_decision.outcome if gov_decision else "review"
        reason_codes = gov_decision.reason_codes if gov_decision else []

        approval_state = cast(ApprovalState, approval.state)
        return ApprovalEnrichedRead(
            id=approval.id,
            action_id=approval.action_id,
            action_hash=approval.action_hash,
            operation=operation,
            resource=resource,
            amount=amount,
            currency=currency,
            category=category,
            vendor_name=vendor_name,
            description=description,
            is_verified_vendor=is_verified_vendor,
            governance_outcome=outcome,
            reason_codes=reason_codes,
            required_role=approval.required_role,
            state=approval_state,
            expires_at=approval.expires_at,
            decided_by=approval.decided_by,
            decision_note=approval.decision_note,
            decided_at=approval.decided_at,
            created_at=approval.created_at,
        )

    def list_approvals(
        self, state: str | None = None, limit: int = 50, offset: int = 0
    ) -> list[ApprovalEnrichedRead]:
        """List human approval requests with optional state filtering."""
        stmt = (
            select(ApprovalModel)
            .order_by(ApprovalModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if state:
            stmt = stmt.where(ApprovalModel.state == state)
        records = self.db.scalars(stmt).all()
        return [self._enrich_approval(r) for r in records]

    def get_approval(self, approval_id: UUID) -> ApprovalEnrichedRead | None:
        """Fetch a single enriched human approval request by ID."""
        record = self.db.get(ApprovalModel, approval_id)
        if not record:
            return None
        return self._enrich_approval(record)

    def decide_approval(
        self,
        approval_id: UUID,
        decision: str,
        note: str | None = None,
        decided_by: str | None = None,
    ) -> ApprovalDecisionResponse:
        """Record operator decision on pending approval, issue permit and settle on approve.

        Fulfills F08 Human Approvals.
        """
        approval = self.db.get(ApprovalModel, approval_id)
        if not approval:
            raise ValueError(f"Approval '{approval_id}' not found.")
        if approval.state != "pending":
            raise ValueError(f"Approval '{approval_id}' is already {approval.state}.")

        now = datetime.now(UTC)
        exec_req = self.db.get(ExecutionRequestModel, approval.action_id)
        if not exec_req:
            raise ValueError(f"Execution request '{approval.action_id}' not found.")

        # Resolve user
        user = None
        if decided_by:
            user = self.db.scalars(select(UserModel).where(UserModel.email == decided_by)).first()
        if not user:
            user = self.db.scalars(
                select(UserModel).where(UserModel.role.in_(["operator", "admin"]))
            ).first()

        permit_id = None
        exec_status = None
        settlement_tx_id = None
        appr_receipt_id = None

        if decision == "approve":
            approval.state = "approved"
            approval.decided_by = user.id if user else None
            approval.decision_note = note
            approval.decided_at = now

            # Append approval receipt
            appr_receipt = self.append_decision_receipt(
                action_id=approval.action_id,
                event_type="approval",
                payload={
                    "approval_id": str(approval.id),
                    "action_id": str(approval.action_id),
                    "decision": "approved",
                    "note": note,
                    "decided_by": user.email if user else "operator@neolith.local",
                    "decided_at": now.isoformat(),
                },
            )
            appr_receipt_id = appr_receipt.id

            # Issue Execution Permit
            permit = self.issue_execution_permit(action_id=approval.action_id)
            permit_id = permit.id

            # Append permit issued receipt
            self.append_decision_receipt(
                action_id=approval.action_id,
                event_type="permit_issued",
                payload={
                    "permit_id": str(permit.id),
                    "action_id": str(approval.action_id),
                    "nonce": permit.nonce,
                    "expires_at": permit.expires_at.isoformat(),
                },
            )

            # Settle if pay_invoice
            if exec_req.operation == "pay_invoice":
                tx = self.execute_settlement(approval.action_id, permit)
                if tx:
                    settlement_tx_id = tx.id
                    exec_status = "settled"
                    self.append_decision_receipt(
                        action_id=approval.action_id,
                        event_type="execution",
                        payload={
                            "transaction_id": str(tx.id),
                            "action_id": str(approval.action_id),
                            "amount": str(tx.amount),
                            "currency": tx.currency,
                            "reference": tx.reference,
                            "completed_at": now.isoformat(),
                        },
                    )
            else:
                exec_status = "permit_issued"

            msg = f"Approval {approval.id} approved. Execution permit {permit.id} issued."

        elif decision == "reject":
            approval.state = "rejected"
            approval.decided_by = user.id if user else None
            approval.decision_note = note
            approval.decided_at = now
            exec_req.state = "denied"
            if exec_req.task_id:
                task = self.db.get(TaskModel, exec_req.task_id)
                if task:
                    task.state = "denied"

            appr_receipt = self.append_decision_receipt(
                action_id=approval.action_id,
                event_type="approval",
                payload={
                    "approval_id": str(approval.id),
                    "action_id": str(approval.action_id),
                    "decision": "rejected",
                    "note": note,
                    "decided_by": user.email if user else "operator@neolith.local",
                    "decided_at": now.isoformat(),
                },
            )
            appr_receipt_id = appr_receipt.id
            msg = f"Approval {approval.id} rejected by operator."
        else:
            raise ValueError(
                f"Invalid approval decision '{decision}'. Must be 'approve' or 'reject'."
            )

        self.db.flush()
        enriched = self._enrich_approval(approval)
        return ApprovalDecisionResponse(
            approval=enriched,
            permit_id=permit_id,
            execution_status=exec_status,
            settlement_tx_id=settlement_tx_id,
            receipt_id=appr_receipt_id,
            message=msg,
        )

    # -------------------------------------------------------------------------
    # F13 Decision Receipts Chain & Verification
    # -------------------------------------------------------------------------

    def append_decision_receipt(
        self,
        action_id: UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> DecisionReceiptModel:
        """Append a tamper-evident, hash-linked receipt to the immutable ledger (F13)."""
        max_index = self.db.scalar(select(func.max(DecisionReceiptModel.chain_index)))
        next_index = (int(max_index) + 1) if max_index is not None else 1

        prev_receipt = self.db.scalars(
            select(DecisionReceiptModel).order_by(DecisionReceiptModel.chain_index.desc())
        ).first()
        prev_hash = prev_receipt.receipt_hash if prev_receipt else None

        payload_digest = hash_payload(payload)
        receipt_digest = compute_receipt_hash(
            prev_hash,
            next_index,
            payload_digest,
            event_type,
        )

        receipt = DecisionReceiptModel(
            id=uuid4(),
            chain_index=next_index,
            action_id=action_id,
            event_type=event_type,
            payload=payload,
            payload_hash=payload_digest,
            previous_receipt_hash=prev_hash,
            receipt_hash=receipt_digest,
            created_at=datetime.now(UTC),
        )
        self.db.add(receipt)
        self.db.flush()
        return receipt

    def list_receipts(
        self, action_id: UUID | None = None, limit: int = 50, offset: int = 0
    ) -> list[DecisionReceiptSchema]:
        """List decision receipts ordered newest first."""
        stmt = (
            select(DecisionReceiptModel)
            .order_by(DecisionReceiptModel.chain_index.desc())
            .offset(offset)
            .limit(limit)
        )
        if action_id:
            stmt = stmt.where(DecisionReceiptModel.action_id == action_id)
        records = self.db.scalars(stmt).all()
        return [
            DecisionReceiptSchema(
                receipt_id=r.id,
                chain_index=int(r.chain_index),
                action_id=r.action_id,
                event_type=cast(ReceiptEventType, r.event_type),
                payload=r.payload,
                payload_hash=r.payload_hash,
                previous_receipt_hash=r.previous_receipt_hash,
                receipt_hash=r.receipt_hash,
                created_at=r.created_at,
            )
            for r in records
        ]

    def get_receipt(self, receipt_id: UUID) -> DecisionReceiptSchema | None:
        """Fetch a single decision receipt by ID."""
        r = self.db.get(DecisionReceiptModel, receipt_id)
        if not r:
            # Check by action_id fallback
            r = self.db.scalars(
                select(DecisionReceiptModel).where(DecisionReceiptModel.action_id == receipt_id)
            ).first()
        if not r:
            return None
        return DecisionReceiptSchema(
            receipt_id=r.id,
            chain_index=int(r.chain_index),
            action_id=r.action_id,
            event_type=cast(ReceiptEventType, r.event_type),
            payload=r.payload,
            payload_hash=r.payload_hash,
            previous_receipt_hash=r.previous_receipt_hash,
            receipt_hash=r.receipt_hash,
            created_at=r.created_at,
        )

    def verify_receipt_chain(self) -> ReceiptVerificationResponse:
        """Verify the cryptographic hash chain integrity of all decision receipts (F13)."""
        receipts = list(
            self.db.scalars(
                select(DecisionReceiptModel).order_by(DecisionReceiptModel.chain_index.asc())
            ).all()
        )
        if not receipts:
            return ReceiptVerificationResponse(
                valid=True,
                total_receipts=0,
                head_hash=None,
                verified_at=datetime.now(UTC),
            )

        prev_hash: str | None = None
        for rec in receipts:
            idx = int(rec.chain_index)
            # Check previous hash linkage
            if rec.previous_receipt_hash != prev_hash:
                return ReceiptVerificationResponse(
                    valid=False,
                    total_receipts=len(receipts),
                    broken_at_index=idx,
                    error=(
                        f"Chain broken at index {idx}: previous_receipt_hash "
                        f"'{rec.previous_receipt_hash}' does not match expected '{prev_hash}'"
                    ),
                    verified_at=datetime.now(UTC),
                )

            # Check payload hash integrity
            expected_payload_hash = hash_payload(rec.payload)
            if rec.payload_hash != expected_payload_hash:
                return ReceiptVerificationResponse(
                    valid=False,
                    total_receipts=len(receipts),
                    broken_at_index=idx,
                    error=f"Chain broken at index {idx}: payload_hash mismatch",
                    verified_at=datetime.now(UTC),
                )

            # Recompute and verify receipt hash
            expected_hash = compute_receipt_hash(
                prev_hash,
                idx,
                rec.payload_hash,
                rec.event_type,
            )
            if rec.receipt_hash != expected_hash:
                return ReceiptVerificationResponse(
                    valid=False,
                    total_receipts=len(receipts),
                    broken_at_index=idx,
                    error=f"Chain broken at index {idx}: receipt_hash mismatch",
                    verified_at=datetime.now(UTC),
                )

            prev_hash = rec.receipt_hash

        return ReceiptVerificationResponse(
            valid=True,
            total_receipts=len(receipts),
            head_hash=receipts[-1].receipt_hash,
            verified_at=datetime.now(UTC),
        )
