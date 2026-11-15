"""Stage 5 evaluation suites, cases, runs, and results.

Revision ID: 0005_stage5_evaluations
Revises: 0004_stage4_approvals_permits
Create Date: 2026-11-15 12:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_stage5_evaluations"
down_revision: str | None = "0004_stage4_approvals_permits"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create evaluation_suites, evaluation_cases, evaluation_runs, and evaluation_results."""
    op.create_table(
        "evaluation_suites",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("version", sa.String(length=32), nullable=False, server_default="1.0.0"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", "version", name="uq_evaluation_suites_name_ver"),
    )

    op.create_table(
        "evaluation_cases",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "suite_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("evaluation_suites.id"),
            nullable=False,
        ),
        sa.Column("external_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scenario", sa.JSON(), nullable=False),
        sa.Column("expected", sa.JSON(), nullable=False),
        sa.UniqueConstraint("suite_id", "external_id", name="uq_evaluation_cases_suite_ext_id"),
    )

    op.create_table(
        "evaluation_runs",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "suite_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("evaluation_suites.id"),
            nullable=False,
        ),
        sa.Column("candidate_manifest", sa.JSON(), nullable=False),
        sa.Column(
            "state",
            sa.String(length=32),
            nullable=False,
            server_default="queued",
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "evaluation_results",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "run_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("evaluation_runs.id"),
            nullable=False,
        ),
        sa.Column(
            "case_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("evaluation_cases.id"),
            nullable=False,
        ),
        sa.Column("actual", sa.JSON(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("model_cost", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("trace_id", sa.String(length=128), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.UniqueConstraint("run_id", "case_id", name="uq_evaluation_results_run_case"),
    )


def downgrade() -> None:
    """Drop evaluation tables."""
    op.drop_table("evaluation_results")
    op.drop_table("evaluation_runs")
    op.drop_table("evaluation_cases")
    op.drop_table("evaluation_suites")
