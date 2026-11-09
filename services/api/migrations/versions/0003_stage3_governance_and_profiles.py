"""Stage 3 governance runtime, execution requests, and governance profiles.

Revision ID: 0003_stage3_governance_profiles
Revises: 0002_stage2_interactions
Create Date: 2026-11-09 23:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_stage3_governance_profiles"
down_revision: str | None = "0002_stage2_interactions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create governance runtime, profiles, bindings, execution requests, and decisions."""
    op.create_table(
        "governance_profiles",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column("style", sa.String(length=32), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("version", sa.String(length=32), nullable=False, server_default="1.0.0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("configuration", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "permission_bindings",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("subject_type", sa.String(length=32), nullable=False),
        sa.Column("subject_id", sa.String(length=128), nullable=False),
        sa.Column("capability", sa.String(length=128), nullable=False),
        sa.Column("resource_scope", sa.JSON(), nullable=False),
        sa.Column("effect", sa.String(length=16), nullable=False, server_default="allow"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "execution_requests",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("trace_id", sa.String(length=128), nullable=False),
        sa.Column("task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "agent_version_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("agent_versions.id"),
            nullable=False,
        ),
        sa.Column(
            "tool_version_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("tool_versions.id"),
            nullable=False,
        ),
        sa.Column("operation", sa.String(length=128), nullable=False),
        sa.Column("resource", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=True),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("parameters_hash", sa.String(length=128), nullable=False),
        sa.Column("context", sa.JSON(), nullable=False),
        sa.Column("context_hash", sa.String(length=128), nullable=False),
        sa.Column("nonce", sa.String(length=128), nullable=False, unique=True),
        sa.Column("state", sa.String(length=32), nullable=False, server_default="received"),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "governance_decisions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "action_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("execution_requests.id"),
            unique=True,
            nullable=False,
        ),
        sa.Column("outcome", sa.String(length=32), nullable=False),
        sa.Column("permission_result", sa.JSON(), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("risk_tier", sa.String(length=8), nullable=False, server_default="R2"),
        sa.Column("policy_version_ids", sa.JSON(), nullable=False),
        sa.Column("policy_bundle_digest", sa.String(length=128), nullable=True),
        sa.Column(
            "profile_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("governance_profiles.id"),
            nullable=True,
        ),
        sa.Column("profile_version", sa.String(length=32), nullable=True),
        sa.Column("budget_check", sa.JSON(), nullable=True),
        sa.Column("tool_metadata", sa.JSON(), nullable=True),
        sa.Column("opa_decision_id", sa.String(length=128), nullable=True),
        sa.Column("input_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "risk_signals",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "action_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("execution_requests.id"),
            nullable=False,
        ),
        sa.Column("signal_type", sa.String(length=64), nullable=False),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=5), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=8, scale=5), nullable=True),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    """Drop tables in reverse dependency order."""
    op.drop_table("risk_signals")
    op.drop_table("governance_decisions")
    op.drop_table("execution_requests")
    op.drop_table("permission_bindings")
    op.drop_table("governance_profiles")
