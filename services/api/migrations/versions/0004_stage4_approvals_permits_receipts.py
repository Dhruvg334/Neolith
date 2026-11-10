"""Stage 4 approvals, execution permits, and decision receipts.

Revision ID: 0004_stage4_approvals_permits_receipts
Revises: 0003_stage3_governance_profiles
Create Date: 2026-11-10 12:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_stage4_approvals_permits_receipts"
down_revision: str | None = "0003_stage3_governance_profiles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create approvals, execution_permits, and decision_receipts tables."""
    op.create_table(
        "approvals",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "action_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("execution_requests.id"),
            nullable=False,
        ),
        sa.Column("action_hash", sa.String(length=128), nullable=False),
        sa.Column(
            "required_role",
            sa.String(length=32),
            nullable=False,
            server_default="approver",
        ),
        sa.Column(
            "state",
            sa.String(length=32),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "decided_by",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("decision_note", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "execution_permits",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "action_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("execution_requests.id"),
            unique=True,
            nullable=False,
        ),
        sa.Column("reservation_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("nonce", sa.String(length=128), unique=True, nullable=False),
        sa.Column("audience", sa.String(length=128), nullable=False),
        sa.Column("revocation_epoch", sa.Numeric(precision=20, scale=0), nullable=False),
        sa.Column("state", sa.String(length=32), nullable=False, server_default="issued"),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("not_before", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_reason", sa.Text(), nullable=True),
    )

    op.create_table(
        "decision_receipts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "chain_index",
            sa.Numeric(precision=20, scale=0),
            unique=True,
            nullable=False,
        ),
        sa.Column(
            "action_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("execution_requests.id"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("payload_hash", sa.String(length=128), nullable=False),
        sa.Column("previous_receipt_hash", sa.String(length=128), nullable=True),
        sa.Column("receipt_hash", sa.String(length=128), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    """Drop decision_receipts, execution_permits, and approvals tables."""
    op.drop_table("decision_receipts")
    op.drop_table("execution_permits")
    op.drop_table("approvals")
