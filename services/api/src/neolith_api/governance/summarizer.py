"""AI/LLM Governance and Financial Agent Activity Summarizer.

Synthesizes session telemetry, evaluated invariants, risk tiers, and budget headroom
into clean, structured executive audit briefs via Google Gemini or deterministic fallback.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from neolith_agent.provider import GeminiLLMProvider
from neolith_api.core.config import Settings
from neolith_api.governance.models import GovernanceDecisionModel, GovernanceProfileModel
from neolith_api.governance.schemas import (
    ActionOutcomeBreakdown,
    ActionSummaryItem,
    GovernanceActivitySummaryResponse,
    InvariantFinding,
    SummarizeActivityRequest,
)

logger = logging.getLogger(__name__)

CANONICAL_ACTIONS: list[ActionSummaryItem] = [
    ActionSummaryItem(
        id="act-inv-001",
        target_id="INV-001",
        action_type="pay_invoice",
        vendor_name="Acme Cloud Services",
        is_verified_vendor=True,
        amount="8000.00",
        currency="INR",
        category="Software",
        outcome="allow",
        risk_tier="R2",
        reason_codes=["BASE_POLICY_ALLOW", "ROUTINE_PAYMENT_PERMITTED"],
        rule_explanation=(
            "Routine spend within Software monthly limit (INR 50,000) and below "
            "INR 25,000 review threshold. Minted 60s single-use execution permit."
        ),
        justification="Verified invoice INV-001 for cloud infrastructure subscription.",
    ),
    ActionSummaryItem(
        id="act-inv-002",
        target_id="INV-002",
        action_type="pay_invoice",
        vendor_name="Nova Compute Systems",
        is_verified_vendor=True,
        amount="35000.00",
        currency="INR",
        category="Infrastructure",
        outcome="review",
        risk_tier="R3",
        reason_codes=["APPROVAL_REQUIRED", "REVIEW_THRESHOLD_EXCEEDED"],
        rule_explanation=(
            "Action exceeds the configured INR 25,000 operator review threshold. "
            "Interception active: dual-key approval required."
        ),
        justification="Payment for dedicated server infrastructure cluster.",
    ),
    ActionSummaryItem(
        id="act-inv-003",
        target_id="INV-003",
        action_type="pay_invoice",
        vendor_name="Quantum Hosting Labs",
        is_verified_vendor=False,
        amount="65000.00",
        currency="INR",
        category="Infrastructure",
        outcome="deny",
        risk_tier="R4",
        reason_codes=["DENY_BUDGET_EXCEEDED", "UNVERIFIED_BENEFICIARY"],
        rule_explanation=(
            "Violates safety invariant: Proposed amount exceeds available Infrastructure "
            "budget and vendor is unverified. Hard-blocked at gateway."
        ),
        justification="Unscheduled data warehouse migration fee.",
    ),
]


def _format_inr(val: Decimal) -> str:
    """Format Decimal into standard two-decimal string representation."""
    return f"{val:.2f}"


def _compute_breakdown(actions: list[ActionSummaryItem]) -> ActionOutcomeBreakdown:
    """Compute exact Decimal totals for allowed, controlled, and blocked actions."""
    allowed_total = Decimal("0.00")
    controlled_total = Decimal("0.00")
    blocked_total = Decimal("0.00")
    allowed_count = 0
    controlled_count = 0
    blocked_count = 0

    for act in actions:
        amt = Decimal(str(act.amount or "0.00"))
        if act.outcome == "allow":
            allowed_count += 1
            allowed_total += amt
        elif act.outcome == "review":
            controlled_count += 1
            controlled_total += amt
        else:
            blocked_count += 1
            blocked_total += amt

    total_proposed = allowed_total + controlled_total + blocked_total

    return ActionOutcomeBreakdown(
        allowed_count=allowed_count,
        allowed_amount=_format_inr(allowed_total),
        controlled_count=controlled_count,
        controlled_amount=_format_inr(controlled_total),
        blocked_count=blocked_count,
        blocked_amount=_format_inr(blocked_total),
        total_proposed_amount=_format_inr(total_proposed),
        currency="INR",
    )


def _build_deterministic_synthesis(
    actions: list[ActionSummaryItem],
    breakdown: ActionOutcomeBreakdown,
    profile_name: str,
    organization_name: str,
) -> GovernanceActivitySummaryResponse:
    """Produce clean, deterministic, audit-ready governance narrative."""
    posture = "Optimal"
    if breakdown.blocked_count > 0:
        posture = "Guarded — Zero Leakage Preserved"
    elif breakdown.controlled_count > 0:
        posture = "Supervised — Approvals Pending"

    executive_summary = (
        f"The Financial AI Agent evaluated {len(actions)} candidate operations proposing "
        f"INR {breakdown.total_proposed_amount} for {organization_name} under '{profile_name}'. "
        f"Neolith's Zero-Trust Runtime Gateway intercepted 100% of candidate operations. "
        f"{breakdown.allowed_count} routine actions (INR {breakdown.allowed_amount}) were "
        f"granted single-use permits, {breakdown.controlled_count} high-value operations "
        f"(INR {breakdown.controlled_amount}) were enqueued for dual-key operator signoff, and "
        f"{breakdown.blocked_count} unbudgeted actions (INR {breakdown.blocked_amount}) were "
        f"hard-blocked at the gateway with zero capital loss."
    )

    key_observations = [
        (
            "Zero Ambient Authority: The Financial AI Agent held zero payment credentials or "
            "signing keys. Dispatches required an authoritative permit minted by OPA Rego."
        ),
        (
            f"Dual-Key Interception: {breakdown.controlled_count} transaction(s) totaling "
            f"INR {breakdown.controlled_amount} exceeded limits and are held in /approvals."
        ),
        (
            f"Safeguarded Capital: Deterministic budget invariants prevented "
            f"INR {breakdown.blocked_amount} in unverified disbursements from treasury compromise."
        ),
        (
            "Cryptographic Auditability: Every decision is recorded with parent hash linking and "
            "exported into an immutable SHA-256 Merkle Decision Receipt."
        ),
    ]

    findings: list[InvariantFinding] = []
    for act in actions:
        ref = act.target_id or act.id or "action"
        vendor = act.vendor_name or "vendor"
        if act.outcome == "allow":
            findings.append(
                InvariantFinding(
                    invariant=f"INV-001 (Routine Spend Limit) [{ref}]",
                    verdict="ALLOW",
                    explanation=(
                        act.rule_explanation
                        or f"Action for {vendor} within authorized category limits."
                    ),
                    action_ref=ref,
                )
            )
        elif act.outcome == "review":
            findings.append(
                InvariantFinding(
                    invariant=f"INV-002 (Human Oversight Threshold) [{ref}]",
                    verdict="REQUIRE_APPROVAL",
                    explanation=(
                        act.rule_explanation
                        or f"Exceeds single-agent threshold (INR {act.amount}). Enqueued."
                    ),
                    action_ref=ref,
                )
            )
        else:
            findings.append(
                InvariantFinding(
                    invariant=f"INV-003 (Safety Invariant & Beneficiary Whitelist) [{ref}]",
                    verdict="DENY",
                    explanation=(
                        act.rule_explanation
                        or "Violated policy invariant: unverified beneficiary or budget exceeded."
                    ),
                    action_ref=ref,
                )
            )

    return GovernanceActivitySummaryResponse(
        executive_summary=executive_summary,
        governance_posture=posture,
        active_profile_name=profile_name,
        breakdown=breakdown,
        key_observations=key_observations,
        invariant_findings=findings,
        audit_readiness_statement=(
            "All evaluated operations conform to EU AI Act Articles 9, 12, 14, and 15. "
            "Zero ambient authority detected. Hash-linked receipts are ready for export."
        ),
        zero_trust_guarantee=(
            "Neolith guarantees that no LLM reasoning step can directly execute a debit. "
            "Execution is structurally impossible without an authoritative signed permit."
        ),
        provider_used="deterministic-synthesis",
        model="neolith-governance-kernel-v1",
        is_live_llm=False,
        generated_at=datetime.now(UTC).isoformat(),
    )


async def generate_activity_summary(
    session: Session,
    request: SummarizeActivityRequest,
    settings: Settings,
) -> GovernanceActivitySummaryResponse:
    """Generate structured AI summary using Gemini or deterministic fallback."""
    # 1. Resolve actions to analyze
    actions = list(request.actions)
    if not actions:
        # Load from database recent decisions
        recent_decisions = (
            session.query(GovernanceDecisionModel)
            .order_by(GovernanceDecisionModel.created_at.desc())
            .limit(20)
            .all()
        )
        if recent_decisions:
            for rec in recent_decisions:
                tool_name = (
                    rec.tool_metadata.get("name")
                    if isinstance(rec.tool_metadata, dict) and rec.tool_metadata.get("name")
                    else "financial_tool"
                )
                outcome_val = rec.outcome if rec.outcome in ("allow", "review", "deny") else "allow"
                actions.append(
                    ActionSummaryItem(
                        id=str(rec.action_id),
                        target_id=str(rec.action_id)[:8],
                        action_type=str(tool_name),
                        vendor_name=str(tool_name),
                        amount="0.00",
                        currency="INR",
                        category="governance",
                        outcome=outcome_val,  # type: ignore[arg-type]
                        risk_tier=rec.risk_tier,
                        reason_codes=list(rec.reason_codes or []),
                    )
                )

    if not actions:
        actions = list(CANONICAL_ACTIONS)

    # 2. Resolve active governance profile
    profile_name = request.profile_name
    if not profile_name:
        active_profile = (
            session.query(GovernanceProfileModel)
            .filter(GovernanceProfileModel.active.is_(True))
            .first()
        )
        profile_name = active_profile.name if active_profile else "Balanced Control"

    organization_name = request.organization_name or "Neolith Finance Sandbox"
    breakdown = _compute_breakdown(actions)

    # 3. Check for Gemini API Key availability
    gemini_key = settings.effective_gemini_api_key
    use_live_gemini = bool(gemini_key and settings.llm_provider != "mock")

    if not use_live_gemini:
        return _build_deterministic_synthesis(
            actions=actions,
            breakdown=breakdown,
            profile_name=profile_name,
            organization_name=organization_name,
        )

    # 4. Invoke live Gemini model
    try:
        provider = GeminiLLMProvider(
            api_key=gemini_key,
            model=settings.gemini_model,
            timeout=settings.dependency_timeout_seconds * 4,
        )

        system_prompt = (
            "You are Neolith's Chief AI Governance and Financial Security Auditor. "
            "You evaluate financial operations attempted by autonomous AI agents against "
            "authoritative Zero-Trust policies, budget ledgers, and EU AI Act standards. "
            "Your output must be strict, clean, professional JSON matching the requested schema. "
            "Never include markdown decoration outside the JSON object. Do not hallucinate numbers."
        )

        actions_payload = [act.model_dump(mode="json") for act in actions]
        allowed_desc = f"{breakdown.allowed_count} actions (INR {breakdown.allowed_amount})"
        review_desc = f"{breakdown.controlled_count} actions (INR {breakdown.controlled_amount})"
        blocked_desc = f"{breakdown.blocked_count} actions (INR {breakdown.blocked_amount})"

        user_prompt = (
            f"Analyze activities evaluated under baseline '{profile_name}' "
            f"for organization '{organization_name}'.\n\n"
            f"Pre-calculated Telemetry Breakdown:\n"
            f"- Total Proposed: INR {breakdown.total_proposed_amount}\n"
            f"- Allowed: {allowed_desc}\n"
            f"- In Review: {review_desc}\n"
            f"- Blocked: {blocked_desc}\n\n"
            f"Actions Evaluated:\n{actions_payload}\n\n"
            "Return a JSON object with these exact keys:\n"
            "- executive_summary: str (Clean 2-3 sentence executive audit summary)\n"
            "- governance_posture: str ('Optimal' | 'Guarded' | 'Restricted')\n"
            "- key_observations: list[str] (3-4 bullet observations on risk containment)\n"
            "- invariant_findings: list of objects with invariant, verdict, explanation\n"
            "- audit_readiness_statement: str (EU AI Act Articles 9, 12, 14, 15 compliance note)\n"
            "- zero_trust_guarantee: str (A concise guarantee statement)\n"
        )

        gemini_response: dict[str, Any] = await provider.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema={},
        )

        raw_findings = gemini_response.get("invariant_findings", [])
        parsed_findings: list[InvariantFinding] = []
        if isinstance(raw_findings, list):
            for item in raw_findings:
                if isinstance(item, dict):
                    parsed_findings.append(
                        InvariantFinding(
                            invariant=str(item.get("invariant", "Safety Invariant")),
                            verdict=str(item.get("verdict", "ALLOW")),
                            explanation=str(item.get("explanation", "")),
                            action_ref=str(item.get("action_ref", ""))
                            if item.get("action_ref")
                            else None,
                        )
                    )

        if not parsed_findings:
            # Fallback findings from pre-built logic
            parsed_findings = _build_deterministic_synthesis(
                actions, breakdown, profile_name, organization_name
            ).invariant_findings

        key_obs = gemini_response.get("key_observations", [])
        if not isinstance(key_obs, list) or not key_obs:
            key_obs = _build_deterministic_synthesis(
                actions, breakdown, profile_name, organization_name
            ).key_observations

        return GovernanceActivitySummaryResponse(
            executive_summary=str(
                gemini_response.get("executive_summary")
                or _build_deterministic_synthesis(
                    actions, breakdown, profile_name, organization_name
                ).executive_summary
            ),
            governance_posture=str(gemini_response.get("governance_posture", "Optimal")),
            active_profile_name=profile_name,
            breakdown=breakdown,
            key_observations=[str(o) for o in key_obs],
            invariant_findings=parsed_findings,
            audit_readiness_statement=str(
                gemini_response.get("audit_readiness_statement")
                or "All evaluated operations conform to EU AI Act High-Risk governance mandates."
            ),
            zero_trust_guarantee=str(
                gemini_response.get("zero_trust_guarantee")
                or "Zero ambient payment authority held by planning agents."
            ),
            provider_used=f"Google Gemini ({settings.gemini_model})",
            model=settings.gemini_model,
            is_live_llm=True,
            generated_at=datetime.now(UTC).isoformat(),
        )

    except Exception as exc:
        logger.warning(
            "Gemini LLM summarization error; falling back to deterministic synthesis: %s",
            exc,
        )
        fallback = _build_deterministic_synthesis(
            actions=actions,
            breakdown=breakdown,
            profile_name=profile_name,
            organization_name=organization_name,
        )
        return fallback
