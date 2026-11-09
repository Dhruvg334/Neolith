"""Read-only HTTP client consuming Neolith financial sandbox APIs (Part B)."""

import inspect
import logging
import os
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx

from neolith_agent.state import FinancialContext, InvoiceSummary

logger = logging.getLogger(__name__)

# Deterministic offline fallback fixtures matching Neolith Demo Corp baseline seed
FALLBACK_ACCOUNTS = [
    {
        "id": "11111111-1111-4111-8111-111111111111",
        "name": "Operations Account",
        "organisation_name": "Neolith Demo Corp",
        "account_type": "operating",
        "currency": "INR",
        "available_balance": "100000.00",
        "status": "active",
    }
]

FALLBACK_BUDGETS = [
    {
        "category": "software",
        "currency": "INR",
        "limit_amount": "25000.00",
        "available_amount": "25000.00",
        "used_amount": "0.00",
    },
    {
        "category": "infrastructure",
        "currency": "INR",
        "limit_amount": "50000.00",
        "available_amount": "50000.00",
        "used_amount": "0.00",
    },
    {
        "category": "miscellaneous",
        "currency": "INR",
        "limit_amount": "10000.00",
        "available_amount": "10000.00",
        "used_amount": "0.00",
    },
]

FALLBACK_INVOICES = [
    {
        "id": "22222222-0001-4000-8000-000000000001",
        "invoice_number": "INV-001",
        "vendor_name": "Acme Cloud",
        "category": "software",
        "amount": "8000.00",
        "currency": "INR",
        "due_date": "2026-11-15",
        "status": "unpaid",
        "is_verified_vendor": True,
        "description": "Enterprise cloud services subscription",
    },
    {
        "id": "22222222-0002-4000-8000-000000000002",
        "invoice_number": "INV-002",
        "vendor_name": "Nova Compute",
        "category": "software",
        "amount": "35000.00",
        "currency": "INR",
        "due_date": "2026-11-20",
        "status": "unpaid",
        "is_verified_vendor": True,
        "description": "High performance compute cluster reservation",
    },
    {
        "id": "22222222-0003-4000-8000-000000000003",
        "invoice_number": "INV-003",
        "vendor_name": "Unknown Supplies",
        "category": "miscellaneous",
        "amount": "75000.00",
        "currency": "INR",
        "due_date": "2026-11-25",
        "status": "unpaid",
        "is_verified_vendor": False,
        "description": "General supplies and miscellaneous services",
    },
]

FALLBACK_BENEFICIARIES = [
    {
        "id": "b1",
        "name": "Acme Cloud",
        "reference": "BENE-ACME-001",
        "verified": True,
        "status": "active",
    },
    {
        "id": "b2",
        "name": "Nova Compute",
        "reference": "BENE-NOVA-002",
        "verified": True,
        "status": "active",
    },
    {
        "id": "b3",
        "name": "Unknown Supplies",
        "reference": "BENE-UNKN-003",
        "verified": False,
        "status": "pending",
    },
]


class FinancialContextClient:
    """Read-only client for retrieving structured financial context from Neolith API."""

    def __init__(
        self,
        base_url: str | None = None,
        client: Any = None,
    ) -> None:
        raw_url = base_url or os.getenv("NEOLITH_API_BASE_URL") or "http://localhost:8000/api/v1"
        self.base_url = raw_url.rstrip("/")
        self._external_client = client

    async def _fetch(self, method: str, path: str, **kwargs: Any) -> Any:
        url = f"{self.base_url}{path}"
        try:
            if self._external_client is not None:
                func = getattr(self._external_client, method.lower())
                res = func(url, **kwargs)
                if inspect.isawaitable(res):
                    resp = await res
                else:
                    resp = res
                return resp

            async with httpx.AsyncClient(timeout=10.0) as client:
                func = getattr(client, method.lower())
                resp = await func(url, **kwargs)
                return resp
        except Exception as exc:
            logger.debug(
                "Financial API fetch for %s failed (%s); using deterministic sandbox fallback",
                path,
                exc,
            )
            return None

    async def get_accounts(self) -> list[dict[str, Any]]:
        """List operating and treasury accounts."""
        resp = await self._fetch("GET", "/financial/accounts")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        return list(FALLBACK_ACCOUNTS)

    async def get_account(self, account_id: UUID | str) -> dict[str, Any]:
        """Retrieve a specific account by UUID."""
        resp = await self._fetch("GET", f"/financial/accounts/{account_id}")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: dict[str, Any] = resp.json()
            return data
        return dict(FALLBACK_ACCOUNTS[0])

    async def get_invoices(self, status: str | None = None) -> list[dict[str, Any]]:
        """List invoices, optionally filtered by status."""
        params = {"status": status} if status else {}
        resp = await self._fetch("GET", "/financial/invoices", params=params)
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        if status:
            return [inv for inv in FALLBACK_INVOICES if inv["status"] == status]
        return list(FALLBACK_INVOICES)

    async def get_invoice(self, id_or_number: str) -> dict[str, Any] | None:
        """Retrieve invoice by UUID or invoice number (e.g. INV-001)."""
        resp = await self._fetch("GET", f"/financial/invoices/{id_or_number}")
        if resp is not None:
            if resp.status_code == 404:
                return None
            if resp.status_code == 200:
                data: dict[str, Any] = resp.json()
                return data
        target = id_or_number.upper()
        for inv in FALLBACK_INVOICES:
            inv_num = str(inv.get("invoice_number", "")).upper()
            if inv_num == target or inv.get("id") == id_or_number:
                return dict(inv)
        return None

    async def get_beneficiaries(self) -> list[dict[str, Any]]:
        """List registered payment beneficiaries."""
        resp = await self._fetch("GET", "/financial/beneficiaries")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        return list(FALLBACK_BENEFICIARIES)

    async def get_beneficiary(self, name_or_id: str) -> dict[str, Any] | None:
        """Find beneficiary by name or ID from list."""
        beneficiaries = await self.get_beneficiaries()
        name_lower = name_or_id.lower().strip()
        for b in beneficiaries:
            if str(b.get("id")) == name_or_id or b.get("name", "").lower() == name_lower:
                return b
        return None

    async def get_transactions(
        self, account_id: UUID | str | None = None, limit: int = 50
    ) -> list[dict[str, Any]]:
        """List recent transactions."""
        params: dict[str, Any] = {"limit": limit}
        if account_id:
            params["account_id"] = str(account_id)
        resp = await self._fetch("GET", "/financial/transactions", params=params)
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        return []

    async def get_budgets(self) -> list[dict[str, Any]]:
        """List category budgets with available amounts."""
        resp = await self._fetch("GET", "/financial/budgets")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        return list(FALLBACK_BUDGETS)

    async def get_budget(self, category: str) -> dict[str, Any] | None:
        """Find budget by category name."""
        budgets = await self.get_budgets()
        cat_lower = category.lower().strip()
        for b in budgets:
            if b.get("category", "").lower() == cat_lower:
                return b
        return None

    async def get_summary(self) -> dict[str, Any]:
        """Get financial sandbox summary."""
        resp = await self._fetch("GET", "/financial/summary")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: dict[str, Any] = resp.json()
            return data
        return {
            "total_available_balance": "100000.00",
            "currency": "INR",
            "primary_account": FALLBACK_ACCOUNTS[0],
            "monthly_budgets": FALLBACK_BUDGETS,
        }

    async def get_tools(self) -> list[dict[str, Any]]:
        """Get registered financial tools and protection tiers."""
        resp = await self._fetch("GET", "/financial/tools")
        if resp is not None and getattr(resp, "status_code", 0) == 200:
            data: list[dict[str, Any]] = resp.json()
            return data
        return []

    async def build_financial_context(self) -> FinancialContext:
        """Build structured FinancialContext model from read endpoints."""
        accounts = await self.get_accounts()
        primary_account = accounts[0] if accounts else {}
        account_id = UUID(str(primary_account.get("id")))
        available_balance = Decimal(str(primary_account.get("available_balance", "0.00")))
        currency = primary_account.get("currency", "INR")

        budgets_raw = await self.get_budgets()
        category_budgets = {
            b["category"]: Decimal(str(b["available_amount"]))
            for b in budgets_raw
            if "category" in b and "available_amount" in b
        }

        invoices_raw = await self.get_invoices(status="unpaid")
        unpaid_invoices: list[InvoiceSummary] = []
        for inv in invoices_raw:
            unpaid_invoices.append(
                InvoiceSummary(
                    invoice_id=UUID(str(inv["id"])),
                    invoice_number=inv["invoice_number"],
                    vendor_name=inv["vendor_name"],
                    category=inv["category"],
                    amount=Decimal(str(inv["amount"])),
                    currency=inv.get("currency", "INR"),
                    due_date=str(inv["due_date"]),
                    status=inv.get("status", "unpaid"),
                    is_verified_vendor=bool(inv.get("is_verified_vendor", False)),
                )
            )

        return FinancialContext(
            account_id=account_id,
            available_balance=available_balance,
            currency=currency,
            category_budgets=category_budgets,
            unpaid_invoices=unpaid_invoices,
        )
