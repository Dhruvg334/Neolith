"""Definitions for the 9 Financial Agent tools (5 read-only R1 tools, 4 protected write tools)."""

import hashlib
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from neolith_api.core.security import compute_sha256_prefixed


@dataclass(frozen=True, slots=True)
class FinancialToolSpec:
    """Declarative specification for a Financial Agent tool and its versioned schemas."""

    tool_id: UUID
    version_id: UUID
    name: str
    version: str
    description: str
    protocol: str
    risk_tier: str
    read_only: bool
    protected: bool
    reversibility: str
    required_capability: str
    endpoint_ref: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]

    @property
    def description_hash(self) -> str:
        digest = hashlib.sha256(self.description.encode("utf-8")).hexdigest()
        return f"sha256:{digest}"

    @property
    def input_schema_hash(self) -> str:
        return compute_sha256_prefixed(self.input_schema)

    @property
    def output_schema_hash(self) -> str:
        return compute_sha256_prefixed(self.output_schema)


FINANCIAL_TOOL_SPECS: tuple[FinancialToolSpec, ...] = (
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000001"),
        version_id=UUID("31000000-0000-4000-8000-000000000001"),
        name="get_account_balance",
        version="1.0.0",
        description=(
            "Read the current available balance and metadata for a synthetic operating account."
        ),
        protocol="mcp",
        risk_tier="R1",
        read_only=True,
        protected=False,
        reversibility="reversible",
        required_capability="financial:read_account",
        endpoint_ref="simulator://banking/get_account_balance",
        input_schema={
            "type": "object",
            "required": ["account_id"],
            "properties": {"account_id": {"type": "string", "format": "uuid"}},
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["account_id", "name", "available_balance", "currency", "status"],
            "properties": {
                "account_id": {"type": "string", "format": "uuid"},
                "name": {"type": "string"},
                "available_balance": {"type": "string"},
                "currency": {"type": "string"},
                "status": {"type": "string"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000002"),
        version_id=UUID("31000000-0000-4000-8000-000000000002"),
        name="list_transactions",
        version="1.0.0",
        description="List recent financial transactions for an account.",
        protocol="mcp",
        risk_tier="R1",
        read_only=True,
        protected=False,
        reversibility="reversible",
        required_capability="financial:read_transactions",
        endpoint_ref="simulator://banking/list_transactions",
        input_schema={
            "type": "object",
            "properties": {
                "account_id": {"type": "string", "format": "uuid"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 100},
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["transactions"],
            "properties": {"transactions": {"type": "array", "items": {"type": "object"}}},
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000003"),
        version_id=UUID("31000000-0000-4000-8000-000000000003"),
        name="get_invoice",
        version="1.0.0",
        description="Retrieve an invoice by invoice_id or invoice_number.",
        protocol="mcp",
        risk_tier="R1",
        read_only=True,
        protected=False,
        reversibility="reversible",
        required_capability="financial:read_invoice",
        endpoint_ref="simulator://banking/get_invoice",
        input_schema={
            "type": "object",
            "required": ["invoice_ref"],
            "properties": {"invoice_ref": {"type": "string", "minLength": 1}},
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": [
                "id",
                "invoice_number",
                "vendor_name",
                "category",
                "amount",
                "currency",
                "status",
                "is_verified_vendor",
            ],
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "invoice_number": {"type": "string"},
                "vendor_name": {"type": "string"},
                "category": {"type": "string"},
                "amount": {"type": "string"},
                "currency": {"type": "string"},
                "status": {"type": "string"},
                "is_verified_vendor": {"type": "boolean"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000004"),
        version_id=UUID("31000000-0000-4000-8000-000000000004"),
        name="get_budget_status",
        version="1.0.0",
        description=(
            "Retrieve monthly category budget limit, used amount, and remaining availability."
        ),
        protocol="mcp",
        risk_tier="R1",
        read_only=True,
        protected=False,
        reversibility="reversible",
        required_capability="financial:read_budget",
        endpoint_ref="simulator://banking/get_budget_status",
        input_schema={
            "type": "object",
            "required": ["category"],
            "properties": {"category": {"type": "string", "minLength": 1}},
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": [
                "category",
                "currency",
                "limit_amount",
                "used_amount",
                "available_amount",
            ],
            "properties": {
                "category": {"type": "string"},
                "currency": {"type": "string"},
                "limit_amount": {"type": "string"},
                "used_amount": {"type": "string"},
                "available_amount": {"type": "string"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000005"),
        version_id=UUID("31000000-0000-4000-8000-000000000005"),
        name="get_beneficiary",
        version="1.0.0",
        description="Look up beneficiary verification status and synthetic reference.",
        protocol="mcp",
        risk_tier="R1",
        read_only=True,
        protected=False,
        reversibility="reversible",
        required_capability="financial:read_beneficiary",
        endpoint_ref="simulator://banking/get_beneficiary",
        input_schema={
            "type": "object",
            "required": ["beneficiary_ref"],
            "properties": {"beneficiary_ref": {"type": "string", "minLength": 1}},
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["id", "name", "reference", "status", "verified"],
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "name": {"type": "string"},
                "reference": {"type": "string"},
                "status": {"type": "string"},
                "verified": {"type": "boolean"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000006"),
        version_id=UUID("31000000-0000-4000-8000-000000000006"),
        name="pay_invoice",
        version="1.0.0",
        description=(
            "Execute payment for an unpaid invoice (protected action requiring execution permit; "
            "R2 base tier, escalates to R3 above approval threshold)."
        ),
        protocol="rest",
        risk_tier="R2",
        read_only=False,
        protected=True,
        reversibility="compensatable",
        required_capability="financial:pay_invoice",
        endpoint_ref="simulator://banking/pay_invoice",
        input_schema={
            "type": "object",
            "required": ["invoice_id", "account_id", "amount", "currency"],
            "properties": {
                "invoice_id": {"type": "string", "format": "uuid"},
                "account_id": {"type": "string", "format": "uuid"},
                "amount": {"type": "string", "pattern": "^[0-9]+(\\.[0-9]{1,2})?$"},
                "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["transaction_id", "invoice_id", "status", "amount", "currency"],
            "properties": {
                "transaction_id": {"type": "string", "format": "uuid"},
                "invoice_id": {"type": "string", "format": "uuid"},
                "status": {"type": "string"},
                "amount": {"type": "string"},
                "currency": {"type": "string"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000007"),
        version_id=UUID("31000000-0000-4000-8000-000000000007"),
        name="transfer_funds",
        version="1.0.0",
        description=(
            "Transfer funds from an operating account to a beneficiary "
            "(protected R3 action requiring execution permit)."
        ),
        protocol="rest",
        risk_tier="R3",
        read_only=False,
        protected=True,
        reversibility="compensatable",
        required_capability="financial:transfer_funds",
        endpoint_ref="simulator://banking/transfer_funds",
        input_schema={
            "type": "object",
            "required": ["account_id", "beneficiary_id", "amount", "currency", "reference"],
            "properties": {
                "account_id": {"type": "string", "format": "uuid"},
                "beneficiary_id": {"type": "string", "format": "uuid"},
                "amount": {"type": "string", "pattern": "^[0-9]+(\\.[0-9]{1,2})?$"},
                "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
                "reference": {"type": "string", "minLength": 1},
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["transaction_id", "status", "amount", "currency"],
            "properties": {
                "transaction_id": {"type": "string", "format": "uuid"},
                "status": {"type": "string"},
                "amount": {"type": "string"},
                "currency": {"type": "string"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000008"),
        version_id=UUID("31000000-0000-4000-8000-000000000008"),
        name="add_beneficiary",
        version="1.0.0",
        description=(
            "Register a new payment beneficiary in the enterprise directory "
            "(protected R4 high-risk action requiring execution permit)."
        ),
        protocol="rest",
        risk_tier="R4",
        read_only=False,
        protected=True,
        reversibility="reversible",
        required_capability="financial:add_beneficiary",
        endpoint_ref="simulator://banking/add_beneficiary",
        input_schema={
            "type": "object",
            "required": ["name", "reference"],
            "properties": {
                "name": {"type": "string", "minLength": 1},
                "reference": {"type": "string", "minLength": 1},
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["beneficiary_id", "name", "reference", "verified", "status"],
            "properties": {
                "beneficiary_id": {"type": "string", "format": "uuid"},
                "name": {"type": "string"},
                "reference": {"type": "string"},
                "verified": {"type": "boolean"},
                "status": {"type": "string"},
            },
        },
    ),
    FinancialToolSpec(
        tool_id=UUID("30000000-0000-4000-8000-000000000009"),
        version_id=UUID("31000000-0000-4000-8000-000000000009"),
        name="cancel_payment",
        version="1.0.0",
        description=(
            "Cancel a pending payment transaction before settlement "
            "(protected R2 action requiring execution permit)."
        ),
        protocol="rest",
        risk_tier="R2",
        read_only=False,
        protected=True,
        reversibility="irreversible",
        required_capability="financial:cancel_payment",
        endpoint_ref="simulator://banking/cancel_payment",
        input_schema={
            "type": "object",
            "required": ["transaction_id", "reason"],
            "properties": {
                "transaction_id": {"type": "string", "format": "uuid"},
                "reason": {"type": "string", "minLength": 1},
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "required": ["transaction_id", "status"],
            "properties": {
                "transaction_id": {"type": "string", "format": "uuid"},
                "status": {"type": "string"},
            },
        },
    ),
)
