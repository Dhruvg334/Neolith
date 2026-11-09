"""Stage 2 multi-channel interaction core tables.

Revision ID: 0002_stage2_interactions
Revises: 0001_stage1_core_and_financial
Create Date: 2026-11-09 20:20:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_stage2_interactions"
down_revision: str | None = "0001_stage1_core_and_financial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create channel_sessions and interaction_turns tables."""
    op.create_table(
        "channel_sessions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("external_session_ref", sa.String(length=255), nullable=True),
        sa.Column("external_user_ref", sa.String(length=255), nullable=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "active_task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=True
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "interaction_turns",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "channel_session_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("channel_sessions.id"),
            nullable=False,
        ),
        sa.Column("task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("provider_message_id", sa.String(length=255), nullable=True),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="received"),
        sa.Column("trace_id", sa.String(length=128), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index(
        "ix_interaction_turns_provider_msg",
        "interaction_turns",
        ["provider_message_id"],
    )
    op.create_index(
        "ix_interaction_turns_session_created",
        "interaction_turns",
        ["channel_session_id", "created_at"],
    )


def downgrade() -> None:
    """Drop channel_sessions and interaction_turns tables."""
    op.drop_index("ix_interaction_turns_session_created", table_name="interaction_turns")
    op.drop_index("ix_interaction_turns_provider_msg", table_name="interaction_turns")
    op.drop_table("interaction_turns")
    op.drop_table("channel_sessions")
