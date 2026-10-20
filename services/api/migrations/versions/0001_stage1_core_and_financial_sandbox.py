"""Stage 1 core platform and financial sandbox tables.

Revision ID: 0001_stage1_core_and_financial
Revises: None
Create Date: 2026-10-20 22:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_stage1_core_and_financial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create Stage 1 core platform and Financial Reference Application tables."""
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="user"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "agents",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "agent_versions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("agent_id", sa.Uuid(as_uuid=True), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("framework", sa.String(length=64), nullable=False),
        sa.Column("model_manifest", sa.JSON(), nullable=False),
        sa.Column("prompt_manifest", sa.JSON(), nullable=False),
        sa.Column("tool_manifest", sa.JSON(), nullable=False),
        sa.Column("artifact_digest", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="inactive"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("agent_id", "version", name="uq_agent_versions_agent_ver"),
    )

    op.create_table(
        "tools",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("protocol", sa.String(length=32), nullable=False, server_default="mcp"),
        sa.Column("risk_tier", sa.String(length=8), nullable=False, server_default="R1"),
        sa.Column(
            "reversibility", sa.String(length=32), nullable=False, server_default="reversible"
        ),
        sa.Column("read_only", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("protected", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("required_capability", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "tool_versions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("tool_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tools.id"), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("description_hash", sa.String(length=128), nullable=False),
        sa.Column("input_schema", sa.JSON(), nullable=False),
        sa.Column("output_schema", sa.JSON(), nullable=False),
        sa.Column("input_schema_hash", sa.String(length=128), nullable=False),
        sa.Column("output_schema_hash", sa.String(length=128), nullable=False),
        sa.Column("endpoint_ref", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("tool_id", "version", name="uq_tool_versions_tool_ver"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("original_request", sa.Text(), nullable=False),
        sa.Column("objective", sa.Text(), nullable=True),
        sa.Column("constraints", sa.JSON(), nullable=False),
        sa.Column("state", sa.String(length=64), nullable=False, server_default="draft"),
        sa.Column("trace_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "budgets",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("owner_type", sa.String(length=32), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="INR"),
        sa.Column("limit_amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("approval_threshold", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("period_type", sa.String(length=32), nullable=False, server_default="month"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "owner_type", "owner_id", "period_type", name="uq_budgets_owner_period"
        ),
    )

    op.create_table(
        "system_state",
        sa.Column("singleton", sa.Boolean(), primary_key=True, nullable=False),
        sa.Column("revocation_epoch", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "emergency_stop_active", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "financial_accounts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("organisation_name", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("account_type", sa.String(length=64), nullable=False, server_default="operating"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="INR"),
        sa.Column("available_balance", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("organisation_name", "name", name="uq_financial_accounts_org_name"),
    )

    op.create_table(
        "financial_beneficiaries",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("reference", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "financial_invoices",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("invoice_number", sa.String(length=64), nullable=False, unique=True),
        sa.Column("vendor_name", sa.String(length=255), nullable=False),
        sa.Column(
            "vendor_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("financial_beneficiaries.id"),
            nullable=True,
        ),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="INR"),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="unpaid"),
        sa.Column(
            "is_verified_vendor", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "financial_transactions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("transaction_type", sa.String(length=64), nullable=False),
        sa.Column(
            "account_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("financial_accounts.id"),
            nullable=False,
        ),
        sa.Column(
            "invoice_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("financial_invoices.id"),
            nullable=True,
        ),
        sa.Column(
            "beneficiary_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("financial_beneficiaries.id"),
            nullable=True,
        ),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="completed"),
        sa.Column("reference", sa.String(length=255), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Drop Stage 1 tables in reverse dependency order."""
    op.drop_table("financial_transactions")
    op.drop_table("financial_invoices")
    op.drop_table("financial_beneficiaries")
    op.drop_table("financial_accounts")
    op.drop_table("system_state")
    op.drop_table("budgets")
    op.drop_table("tasks")
    op.drop_table("tool_versions")
    op.drop_table("tools")
    op.drop_table("agent_versions")
    op.drop_table("agents")
    op.drop_table("users")
