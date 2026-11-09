"""Provider-pluggable LLM adapter, deterministic mock, and OpenAI adapter (D-012, Part C)."""

import json
import os
import re
from typing import Any, Protocol


class LLMProviderAdapter(Protocol):
    """Vendor-neutral model adapter contract."""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a structured JSON response conforming to response_schema."""


class DeterministicMockLLMProvider:
    """Deterministic model provider for CI, offline tests, and deterministic demo fallback.

    Produces strictly financial-domain intent analysis and reasoning without external API calls.
    """

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        _ = (system_prompt, response_schema)
        text = user_prompt.strip()
        lower = text.lower()

        # Check for prompt injection patterns
        is_injection = False
        if any(
            pattern in lower
            for pattern in [
                "ignore previous instructions",
                "disregard previous instructions",
                "override governance",
                "bypass policy",
            ]
        ):
            is_injection = True

        # Check for ambiguity: "Pay the invoice" without an invoice number
        invoice_matches = re.findall(r"INV-\d{3}", text, re.IGNORECASE)
        has_pay_verb = any(word in lower for word in ["pay", "payment", "settle"])

        if (
            has_pay_verb
            and not invoice_matches
            and "balance" not in lower
            and "transaction" not in lower
        ):
            return {
                "intent": "clarification_required",
                "needs_clarification": True,
                "clarification_message": (
                    "Multiple invoices are available in the financial sandbox. "
                    "Please specify which invoice you would like to inspect or pay "
                    "(e.g. INV-001, INV-002, or INV-003)."
                ),
                "target_id": None,
                "amount": None,
                "currency": "INR",
                "category": None,
                "vendor_name": None,
                "is_injection": is_injection,
            }

        # Specific invoice pay intents
        if "inv-001" in lower:
            return {
                "intent": "pay_invoice",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": "INV-001",
                "amount": "8000.00",
                "currency": "INR",
                "category": "software",
                "vendor_name": "Acme Cloud",
                "justification": (
                    "Payment requested for verified invoice INV-001 "
                    "from Acme Cloud within software budget."
                ),
                "evidence_refs": [
                    "invoice:INV-001",
                    "beneficiary:Acme Cloud",
                    "budget:software",
                    "account:Operations Account",
                ],
                "is_injection": is_injection,
            }

        if "inv-002" in lower:
            return {
                "intent": "pay_invoice",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": "INV-002",
                "amount": "35000.00",
                "currency": "INR",
                "category": "software",
                "vendor_name": "Nova Compute",
                "justification": (
                    "Payment requested for invoice INV-002 from Nova Compute "
                    "(exceeds software budget limit)."
                ),
                "evidence_refs": [
                    "invoice:INV-002",
                    "beneficiary:Nova Compute",
                    "budget:software",
                    "account:Operations Account",
                ],
                "is_injection": is_injection,
            }

        if "inv-003" in lower:
            return {
                "intent": "pay_invoice",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": "INV-003",
                "amount": "75000.00",
                "currency": "INR",
                "category": "miscellaneous",
                "vendor_name": "Unknown Supplies",
                "justification": (
                    "Payment requested for invoice INV-003 from unverified vendor Unknown Supplies."
                ),
                "evidence_refs": [
                    "invoice:INV-003",
                    "beneficiary:Unknown Supplies",
                    "budget:miscellaneous",
                    "account:Operations Account",
                ],
                "is_injection": is_injection,
            }

        # Read balance queries
        if any(
            term in lower
            for term in ["balance", "account balance", "how much money", "funds available"]
        ):
            return {
                "intent": "read_account_balance",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": "Operations Account",
                "amount": None,
                "currency": "INR",
                "category": None,
                "vendor_name": None,
                "is_injection": is_injection,
            }

        # Transactions queries
        if any(
            term in lower for term in ["transaction", "transactions", "ledger", "recent payments"]
        ):
            return {
                "intent": "list_transactions",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": None,
                "amount": None,
                "currency": "INR",
                "category": None,
                "vendor_name": None,
                "is_injection": is_injection,
            }

        # Budget queries
        if any(term in lower for term in ["budget", "budgets", "quota", "limit"]):
            return {
                "intent": "inspect_budget",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": "software" if "software" in lower else None,
                "amount": None,
                "currency": "INR",
                "category": "software" if "software" in lower else None,
                "vendor_name": None,
                "is_injection": is_injection,
            }

        # Beneficiary queries
        if any(term in lower for term in ["beneficiary", "beneficiaries", "vendor", "vendors"]):
            return {
                "intent": "inspect_beneficiary",
                "needs_clarification": False,
                "clarification_message": None,
                "target_id": None,
                "amount": None,
                "currency": "INR",
                "category": None,
                "vendor_name": None,
                "is_injection": is_injection,
            }

        # Fallback / general financial query
        return {
            "intent": "unknown",
            "needs_clarification": True,
            "clarification_message": (
                "I am Neolith's Financial AI Agent. I can help inspect account balances, "
                "transactions, budgets, and invoices, or prepare governed payment proposals "
                "(e.g. for INV-001, INV-002, or INV-003)."
            ),
            "target_id": None,
            "amount": None,
            "currency": "INR",
            "category": None,
            "vendor_name": None,
            "is_injection": is_injection,
        }


class OpenAILLMProvider:
    """Official OpenAI Python SDK adapter for production model reasoning."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        key = api_key or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not key:
            msg = "OpenAI API key must be provided or set via LLM_API_KEY / OPENAI_API_KEY"
            raise ValueError(msg)
        self.api_key = key
        self.model = model or os.getenv("LLM_MODEL_FAST") or "gpt-4o-mini"

        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=self.api_key)

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate structured JSON via OpenAI Chat Completions API."""
        _ = response_schema
        response = await self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )
        content = response.choices[0].message.content or "{}"
        parsed: dict[str, Any] = json.loads(content)
        return parsed
