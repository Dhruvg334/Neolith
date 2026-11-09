"""Tests for Phase 2 Interaction Core, session/task binding, persistence, and Alembic migrations."""

from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.interactions.service import InteractionCoreService
from neolith_api.main import create_app


@pytest.fixture()
def client_with_db() -> TestClient:
    """FastAPI TestClient with seeded in-memory database."""
    settings = Settings(
        DATABASE_URL="sqlite+pysqlite:///:memory:",
        REDIS_URL="redis://localhost:6379/0",
        OPA_URL="http://localhost:8181",
    )
    app = create_app(settings=settings)
    engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(engine, seed_if_empty=True)
    app.state.db_engine = engine
    app.state.session_factory = factory
    return TestClient(app)


def test_alembic_stage2_migration_creates_interaction_tables(tmp_path: Path) -> None:
    """Verify Alembic 0002_stage2_interactions creates interaction tables."""
    db_file = tmp_path / "alembic_stage2.db"
    db_url = f"sqlite+pysqlite:///{db_file.as_posix()}"

    api_dir = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(api_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(api_dir / "migrations"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)

    command.upgrade(alembic_cfg, "head")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert "channel_sessions" in tables
    assert "interaction_turns" in tables
    engine.dispose()


def test_web_interaction_message_normalisation_and_response(client_with_db: TestClient) -> None:
    """POST /api/v1/interactions/message creates channel session, task, and returns response."""
    payload = {
        "text": "Pay INV-001 if the invoice is valid and within our software budget.",
        "task_id": None,
    }
    response = client_with_db.post("/api/v1/interactions/message", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "interaction_id" in data
    assert "task_id" in data
    assert "trace_id" in data
    assert data["status"] == "proposal_ready"
    assert "not authorised or executed" in data["message"]
    assert data["proposed_action"] is not None
    assert data["proposed_action"]["action_type"] == "pay_invoice"
    assert data["proposed_action"]["target_id"] == "INV-001"
    assert data["proposed_action"]["amount"] == "8000.00"
    assert len(data["evidence_refs"]) > 0


def test_web_interaction_continuation_reuses_existing_task(client_with_db: TestClient) -> None:
    """Continuing an existing task by passing task_id preserves the active task correlation."""
    first_res = client_with_db.post(
        "/api/v1/interactions/message",
        json={"text": "What is our Operations Account balance?", "task_id": None},
    )
    assert first_res.status_code == 200
    task_id = first_res.json()["task_id"]

    second_res = client_with_db.post(
        "/api/v1/interactions/message",
        json={"text": "Can we pay INV-002?", "task_id": task_id},
    )
    assert second_res.status_code == 200
    second_data = second_res.json()
    assert second_data["task_id"] == task_id


def test_interaction_core_service_session_and_turn_persistence(client_with_db: TestClient) -> None:
    """Direct InteractionCoreService test for session, task creation, and deduplication."""
    factory = client_with_db.app.state.session_factory  # type: ignore[attr-defined]
    with factory() as db:
        service = InteractionCoreService(db)

        session = service.get_or_create_session(
            channel="web",
            provider="neolith_web",
            external_session_ref="test-session-123",
        )
        assert session.id is not None
        assert session.channel == "web"
        assert session.provider == "neolith_web"

        task = service.resolve_task_for_session(session, "Check financial balance")
        assert task.id is not None
        assert session.active_task_id == task.id

        turn = service.record_inbound_turn(
            session=session,
            task_id=task.id,
            text="Check financial balance",
            provider_message_id="msg-unique-001",
            trace_id="trace-test-123",
        )
        assert turn.id is not None
        db.commit()

        # Check deduplication
        dup = service.check_duplicate_message("msg-unique-001")
        assert dup is not None
        assert dup.id == turn.id

        non_dup = service.check_duplicate_message("msg-unseen-999")
        assert non_dup is None


def test_internal_agent_worker_http_service_endpoint() -> None:
    """POST /internal/v1/turns on the agent worker service returns valid InterfaceResponse."""
    from datetime import UTC, datetime

    from neolith_agent.server import create_agent_worker_app

    worker_app = create_agent_worker_app()
    worker_client = TestClient(worker_app)

    # Health check
    health_res = worker_client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # Turn processing
    turn_payload = {
        "interaction_id": str(uuid4()),
        "channel": "web",
        "provider": "neolith_web",
        "text": "What is our Operations Account balance?",
        "received_at": datetime.now(UTC).isoformat(),
        "metadata": {},
    }
    response = worker_client.post("/internal/v1/turns", json=turn_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "Operations Account balance is INR 100,000.00" in data["message"]
