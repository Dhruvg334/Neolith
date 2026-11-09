"""Read-only HTTP client consuming Neolith financial sandbox APIs."""

import inspect
import logging
import os
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx

from neolith_agent.state import FinancialContext, InvoiceSummary

logger = logging.getLogger(__name__)

# Deterministic offline fallback fixtures matching Neolith Finance baseline seed
FALLBACK_ACCOUNTS = [
    {
        "id": "11111111-1111-4111-8111-111111111111",
        "name": "Operations Account",
        "organisation_name": "Neolith Finance",
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
        "category": "infrastructure",
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


class FinancialContextError(RuntimeError):
    """Raised when an API request to the financial sandbox backend fails."""


class FinancialContextClient:
    """Read-only client for retrieving structured financial context from Neolith API."""

    def __init__(
        self,
        base_url: str | None = None,
        client: Any = None,
        mode: str | None = None,
    ) -> None:
        env_mode = os.getenv("NEOLITH_FINANCIAL_DATA_MODE")
        configured_mode = (
            mode if mode is not None else (env_mode if env_mode is not None else "api")
        )
        normalized_mode = configured_mode.strip().lower()
        if normalized_mode not in ("api", "fixture"):
            raise ValueError(
                f"Invalid NEOLITH_FINANCIAL_DATA_MODE: '{configured_mode}'. "
                "Must be 'api' or 'fixture'."
            )
        self.mode = normalized_mode
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
            raise FinancialContextError(
                f"Financial API request failed for {method} {url}: {exc}"
            ) from exc

    async def get_accounts(self) -> list[dict[str, Any]]:
        """List operating and treasury accounts."""
        if self.mode == "fixture":
            return [dict(a) for a in FALLBACK_ACCOUNTS]
        resp = await self._fetch("GET", "/financial/accounts")
        status = getattr(resp, "status_code", 0)
        if status != 200:
            raise FinancialContextError(
                f"GET /financial/accounts returned HTTP {status}: {getattr(resp, 'text', '')}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

    async def get_account(self, account_id: UUID | str) -> dict[str, Any]:
        """Retrieve a specific account by UUID."""
        if self.mode == "fixture":
            target = str(account_id)
            for acc in FALLBACK_ACCOUNTS:
                if str(acc.get("id")) == target:
                    return dict(acc)
            return dict(FALLBACK_ACCOUNTS[0])
        resp = await self._fetch("GET", f"/financial/accounts/{account_id}")
        status = getattr(resp, "status_code", 0)
        if status == 404:
            raise FinancialContextError(f"Account '{account_id}' not found.")
        if status != 200:
            err_text = getattr(resp, "text", "")
            raise FinancialContextError(
                f"GET /financial/accounts/{account_id} returned HTTP {status}: {err_text}"
            )
        data: dict[str, Any] = resp.json()
        return data

    async def get_invoices(self, status: str | None = None) -> list[dict[str, Any]]:
        """List invoices, optionally filtered by status."""
        if self.mode == "fixture":
            if status:
                return [dict(inv) for inv in FALLBACK_INVOICES if inv["status"] == status]
            return [dict(inv) for inv in FALLBACK_INVOICES]
        params = {"status": status} if status else {}
        resp = await self._fetch("GET", "/financial/invoices", params=params)
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            raise FinancialContextError(
                f"GET /financial/invoices returned HTTP {status_code}: {getattr(resp, 'text', '')}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

    async def get_invoice(self, id_or_number: str) -> dict[str, Any] | None:
        """Retrieve invoice by UUID or invoice number (e.g. INV-001)."""
        if self.mode == "fixture":
            target = id_or_number.upper()
            for inv in FALLBACK_INVOICES:
                inv_num = str(inv.get("invoice_number", "")).upper()
                if inv_num == target or str(inv.get("id", "")).upper() == target:
                    return dict(inv)
            return None
        resp = await self._fetch("GET", f"/financial/invoices/{id_or_number}")
        status_code = getattr(resp, "status_code", 0)
        if status_code == 404:
            return None
        if status_code != 200:
            err_text = getattr(resp, "text", "")
            raise FinancialContextError(
                f"GET /financial/invoices/{id_or_number} returned HTTP {status_code}: {err_text}"
            )
        data: dict[str, Any] = resp.json()
        return data

    async def get_beneficiaries(self) -> list[dict[str, Any]]:
        """List registered payment beneficiaries."""
        if self.mode == "fixture":
            return [dict(b) for b in FALLBACK_BENEFICIARIES]
        resp = await self._fetch("GET", "/financial/beneficiaries")
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            err_text = getattr(resp, "text", "")
            raise FinancialContextError(
                f"GET /financial/beneficiaries returned HTTP {status_code}: {err_text}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

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
        if self.mode == "fixture":
            return []
        params: dict[str, Any] = {"limit": limit}
        if account_id:
            params["account_id"] = str(account_id)
        resp = await self._fetch("GET", "/financial/transactions", params=params)
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            err_text = getattr(resp, "text", "")
            raise FinancialContextError(
                f"GET /financial/transactions returned HTTP {status_code}: {err_text}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

    async def get_budgets(self) -> list[dict[str, Any]]:
        """List category budgets with available amounts."""
        if self.mode == "fixture":
            return [dict(b) for b in FALLBACK_BUDGETS]
        resp = await self._fetch("GET", "/financial/budgets")
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            raise FinancialContextError(
                f"GET /financial/budgets returned HTTP {status_code}: {getattr(resp, 'text', '')}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

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
        if self.mode == "fixture":
            return {
                "total_available_balance": "100000.00",
                "currency": "INR",
                "primary_account": dict(FALLBACK_ACCOUNTS[0]),
                "monthly_budgets": [dict(b) for b in FALLBACK_BUDGETS],
            }
        resp = await self._fetch("GET", "/financial/summary")
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            raise FinancialContextError(
                f"GET /financial/summary returned HTTP {status_code}: {getattr(resp, 'text', '')}"
            )
        data: dict[str, Any] = resp.json()
        return data

    async def get_tools(self) -> list[dict[str, Any]]:
        """Get registered financial tools and protection tiers."""
        if self.mode == "fixture":
            return []
        resp = await self._fetch("GET", "/financial/tools")
        status_code = getattr(resp, "status_code", 0)
        if status_code != 200:
            raise FinancialContextError(
                f"GET /financial/tools returned HTTP {status_code}: {getattr(resp, 'text', '')}"
            )
        data: list[dict[str, Any]] = resp.json()
        return data

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
