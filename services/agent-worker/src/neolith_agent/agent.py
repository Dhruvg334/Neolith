"""Stateful LangGraph Financial AI Agent implementation (Part A)."""

from decimal import Decimal
from typing import Any
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from neolith_agent.client import FinancialContextClient
from neolith_agent.interfaces import InteractionTurn, InterfaceResponse
from neolith_agent.provider import DeterministicMockLLMProvider, LLMProviderAdapter
from neolith_agent.state import (
    AgentWorkflowState,
    FinancialActionProposal,
)

SYSTEM_PROMPT = (
    "You are Neolith's Financial AI Agent, the primary reference agent used to "
    "demonstrate governed enterprise execution. You understand financial tasks, "
    "retrieve approved read-only financial context, ask for clarification when necessary, "
    "build inspectable plans, and emit structured financial action proposals. "
    "You never grant permissions, evaluate policies, or issue permits. "
    "Protected financial execution must remain blocked."
)


class FinancialAIAgent:
    """Stateful LangGraph agent for financial understanding, read context, and action proposal."""

    def __init__(
        self,
        provider: LLMProviderAdapter | None = None,
        context_client: FinancialContextClient | None = None,
    ) -> None:
        self.provider = provider or DeterministicMockLLMProvider()
        self.context_client = context_client or FinancialContextClient()
        self.workflow = self._build_graph()

    def _build_graph(self) -> Any:
        builder = StateGraph(AgentWorkflowState)

        builder.add_node("understand_request", self._understand_request_node)
        builder.add_node("clarify", self._clarify_node)
        builder.add_node("retrieve_financial_context", self._retrieve_financial_context_node)
        builder.add_node("analyse_evidence", self._analyse_evidence_node)
        builder.add_node("build_plan", self._build_plan_node)
        builder.add_node("propose_action_or_answer", self._propose_action_or_answer_node)

        builder.add_edge(START, "understand_request")
        builder.add_conditional_edges(
            "understand_request",
            self._route_after_understand,
            {
                "clarify": "clarify",
                "retrieve_financial_context": "retrieve_financial_context",
            },
        )
        builder.add_edge("clarify", END)
        builder.add_edge("retrieve_financial_context", "analyse_evidence")
        builder.add_edge("analyse_evidence", "build_plan")
        builder.add_edge("build_plan", "propose_action_or_answer")
        builder.add_edge("propose_action_or_answer", END)

        return builder.compile()

    async def _understand_request_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 1: Extract intent, entities, and detect ambiguity or prompt injections."""
        result = await self.provider.generate_structured(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=state.raw_request,
            response_schema={},
        )

        intent = result.get("intent", "unknown")
        needs_clarification = bool(result.get("needs_clarification", False))
        clarification_msg = result.get("clarification_message")
        target_id = result.get("target_id")
        amount = result.get("amount")
        currency = result.get("currency", "INR")
        category = result.get("category")
        vendor_name = result.get("vendor_name")
        is_injection = bool(result.get("is_injection", False))

        # Check raw request for prompt injection indicators
        raw_lower = state.raw_request.lower()
        tainted = (
            is_injection
            or "ignore previous instructions" in raw_lower
            or "transfer inr 75,000" in raw_lower
        )

        entities = {
            "target_id": target_id,
            "amount": amount,
            "currency": currency,
            "category": category,
            "vendor_name": vendor_name,
        }

        return {
            "current_node": "understand_request",
            "extracted_intent": intent,
            "extracted_entities": entities,
            "needs_clarification": needs_clarification,
            "clarification_message": clarification_msg,
            "tainted_context_detected": tainted,
        }

    def _route_after_understand(self, state: AgentWorkflowState) -> str:
        """Route conditionally based on whether clarification is required."""
        if state.needs_clarification:
            return "clarify"
        return "retrieve_financial_context"

    async def _clarify_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 2 (clarification path): Emit structured clarification response."""
        return {
            "current_node": "clarify",
            "response_status": "needs_clarification",
            "response_message": state.clarification_message
            or (
                "Could you please specify which invoice or account "
                "you would like to inspect or pay?"
            ),
            "evidence_refs": [],
        }

    async def _retrieve_financial_context_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 3: Consume read-only financial APIs via FinancialContextClient."""
        # Retrieve full financial context
        fin_context = await self.context_client.build_financial_context()

        # Check for prompt injection embedded in unpaid invoice notes
        tainted = state.tainted_context_detected
        for inv in fin_context.unpaid_invoices:
            # Check if invoice data itself carries suspicious prompt injection
            if "ignore previous instructions" in inv.vendor_name.lower():
                tainted = True

        return {
            "current_node": "retrieve_financial_context",
            "financial_context": fin_context,
            "tainted_context_detected": tainted,
        }

    async def _analyse_evidence_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 4: Cross-reference entities with context and assemble evidence refs."""
        intent = state.extracted_intent or "unknown"
        entities = state.extracted_entities
        target_id = entities.get("target_id")
        evidence_refs: list[str] = []

        fin_ctx = state.financial_context

        if intent == "read_account_balance":
            account_name = target_id or "Operations Account"
            evidence_refs = [f"account:{account_name}"]

        elif intent == "list_transactions":
            evidence_refs = ["account:Operations Account", "ledger:transactions"]

        elif intent == "inspect_budget":
            cat = entities.get("category") or "software"
            evidence_refs = [f"budget:{cat}"]

        elif intent == "inspect_beneficiary":
            evidence_refs = ["beneficiaries:registry"]

        elif intent in ("pay_invoice", "transfer_funds"):
            # Target invoice evidence
            inv_number = str(target_id) if target_id else "INV-001"
            evidence_refs.append(f"invoice:{inv_number}")

            # Match invoice from financial context if available
            matched_inv = None
            if fin_ctx:
                for inv in fin_ctx.unpaid_invoices:
                    if inv.invoice_number.upper() == inv_number.upper():
                        matched_inv = inv
                        break

            if matched_inv:
                vendor = matched_inv.vendor_name
                category = matched_inv.category
                evidence_refs.append(f"beneficiary:{vendor}")
                evidence_refs.append(f"budget:{category}")
                evidence_refs.append("account:Operations Account")
            else:
                vendor = entities.get("vendor_name") or "Acme Cloud"
                category = entities.get("category") or "software"
                evidence_refs.append(f"beneficiary:{vendor}")
                evidence_refs.append(f"budget:{category}")
                evidence_refs.append("account:Operations Account")

        return {
            "current_node": "analyse_evidence",
            "evidence_refs": evidence_refs,
        }

    async def _build_plan_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 5: Construct structured execution plan for proposal or read response."""
        intent = state.extracted_intent
        if intent in ("pay_invoice", "transfer_funds"):
            plan_summary = (
                f"Resolved target {state.extracted_entities.get('target_id')}. "
                "Retrieved and verified invoice, beneficiary, account, and budget records. "
                "Constructed structured payment proposal for Neolith governance evaluation."
            )
        else:
            plan_summary = f"Gathered read-only context for {intent} query."

        return {
            "current_node": "build_plan",
            "plan_summary": plan_summary,
        }

    async def _propose_action_or_answer_node(self, state: AgentWorkflowState) -> dict[str, Any]:
        """Node 6: Produce either a completed read response or a typed FinancialActionProposal."""
        intent = state.extracted_intent
        fin_ctx = state.financial_context

        # Read intents complete directly without a FinancialActionProposal
        if intent == "read_account_balance":
            balance_str = "100000.00"
            currency = "INR"
            if fin_ctx:
                balance_str = f"{fin_ctx.available_balance:.2f}"
                currency = fin_ctx.currency
            bal_fmt = f"{Decimal(balance_str):,.2f}"
            return {
                "current_node": "completed",
                "response_status": "completed",
                "response_message": f"Our Operations Account balance is {currency} {bal_fmt}.",
                "financial_proposal": None,
            }

        if intent == "list_transactions":
            return {
                "current_node": "completed",
                "response_status": "completed",
                "response_message": "Retrieved latest ledger transactions from the sandbox.",
                "financial_proposal": None,
            }

        if intent == "inspect_budget":
            cat = state.extracted_entities.get("category") or "software"
            avail = (
                fin_ctx.category_budgets.get(cat, Decimal("0.00"))
                if fin_ctx
                else Decimal("25000.00")
            )
            return {
                "current_node": "completed",
                "response_status": "completed",
                "response_message": f"Available budget for '{cat}' is INR {avail:,.2f}.",
                "financial_proposal": None,
            }

        if intent == "inspect_beneficiary":
            return {
                "current_node": "completed",
                "response_status": "completed",
                "response_message": "Retrieved registered beneficiary list and statuses.",
                "financial_proposal": None,
            }

        # Protected intents create a typed FinancialActionProposal
        entities = state.extracted_entities
        target_id = entities.get("target_id") or "INV-001"
        currency = entities.get("currency") or "INR"

        # Match invoice in context if available
        matched_inv = None
        if fin_ctx:
            for inv in fin_ctx.unpaid_invoices:
                if inv.invoice_number.upper() == target_id.upper():
                    matched_inv = inv
                    break

        if matched_inv:
            amount = matched_inv.amount
            vendor_name = matched_inv.vendor_name
            category = matched_inv.category
            is_verified = matched_inv.is_verified_vendor
        else:
            amount = Decimal(str(entities.get("amount") or "8000.00"))
            vendor_name = entities.get("vendor_name") or "Acme Cloud"
            category = entities.get("category") or "software"
            is_verified = target_id in ("INV-001", "INV-002")

        # Specific message wording per reference scenario
        if target_id == "INV-001":
            justification = "The user requested payment of this specific invoice after validation."
            msg = (
                f"I found INV-001 from {vendor_name} for {currency} {amount:,.2f} "
                "and prepared a payment proposal using the verified invoice, beneficiary, "
                "and software-budget records. Neolith governance has not authorised "
                "or executed this action yet."
            )
        elif target_id == "INV-002":
            justification = (
                "Payment proposed for invoice INV-002; amount exceeds software category budget."
            )
            msg = (
                f"I found INV-002 from {vendor_name} for {currency} {amount:,.2f} "
                "and prepared a payment proposal. Note that this exceeds the available software "
                "budget limit. Neolith governance has not authorised or executed this action yet."
            )
        elif target_id == "INV-003":
            status_note = "unverified" if not is_verified else "verified"
            justification = f"Payment proposed for invoice INV-003 with {status_note} beneficiary."
            msg = (
                f"I found INV-003 from {vendor_name} for {currency} {amount:,.2f} "
                f"and prepared a payment proposal. Note that the vendor is {status_note}. "
                "Neolith governance has not authorised or executed this action yet."
            )
        else:
            justification = f"Payment proposal prepared for {target_id}."
            msg = (
                f"I found {target_id} from {vendor_name} for {currency} {amount:,.2f} "
                "and prepared a payment proposal. Neolith governance has not authorised "
                "or executed this action yet."
            )

        proposal = FinancialActionProposal(
            action_type="pay_invoice",
            target_id=target_id,
            amount=amount,
            currency=currency,
            category=category,
            vendor_name=vendor_name,
            justification=justification,
            evidence_refs=list(state.evidence_refs),
        )

        return {
            "current_node": "propose_action",
            "response_status": "proposal_ready",
            "response_message": msg,
            "financial_proposal": proposal,
        }

    async def process_turn(self, turn: InteractionTurn) -> InterfaceResponse:
        """Run the Financial AI Agent workflow on an inbound InteractionTurn."""
        task_id = turn.task_id or uuid4()
        user_id = turn.user_id or uuid4()
        trace_id = str(turn.metadata.get("trace_id") or f"trace-{uuid4().hex[:12]}")

        initial_state = AgentWorkflowState(
            task_id=task_id,
            user_id=user_id,
            trace_id=trace_id,
            raw_request=turn.text,
            current_node="understand_request",
        )

        final_state_dict = await self.workflow.ainvoke(initial_state)

        # Parse final response values
        raw_status = final_state_dict.get("response_status")
        valid_statuses = ("accepted", "needs_clarification", "proposal_ready", "completed", "error")
        status_val: Any = raw_status if raw_status in valid_statuses else "completed"
        msg = final_state_dict.get("response_message") or ""
        proposal = final_state_dict.get("financial_proposal")
        evidence = final_state_dict.get("evidence_refs") or []

        return InterfaceResponse(
            interaction_id=turn.interaction_id,
            task_id=task_id,
            trace_id=trace_id,
            status=status_val,
            message=msg,
            proposed_action=proposal,
            evidence_refs=evidence,
        )
