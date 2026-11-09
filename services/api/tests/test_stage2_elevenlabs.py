"""Tests for ElevenLabs Custom LLM voice adapter (SSE streaming, bearer auth, error handling)."""

import json

import pytest
from fastapi.testclient import TestClient

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.main import create_app

TEST_BEARER_TOKEN = "secret_elevenlabs_token_xyz123"
ELEVENLABS_URL = "/integrations/elevenlabs/v1/chat/completions"


@pytest.fixture()
def elevenlabs_client() -> TestClient:
    """TestClient with configured ElevenLabs Custom LLM bearer token."""
    settings = Settings(
        DATABASE_URL="sqlite+pysqlite:///:memory:",
        REDIS_URL="redis://localhost:6379/0",
        OPA_URL="http://localhost:8181",
        ELEVENLABS_CUSTOM_LLM_BEARER_TOKEN=TEST_BEARER_TOKEN,
    )
    app = create_app(settings=settings)
    engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(engine, seed_if_empty=True)
    app.state.db_engine = engine
    app.state.session_factory = factory
    return TestClient(app)


def test_elevenlabs_missing_bearer_token_rejected(elevenlabs_client: TestClient) -> None:
    """Request without Authorization header returns 401 Unauthorized."""
    payload = {
        "model": "neolith-financial-agent",
        "messages": [{"role": "user", "content": "What is our balance?"}],
        "stream": True,
    }
    response = elevenlabs_client.post(ELEVENLABS_URL, json=payload)
    assert response.status_code == 401
    assert "Missing or malformed Bearer" in response.text


def test_elevenlabs_invalid_bearer_token_rejected(elevenlabs_client: TestClient) -> None:
    """Request with incorrect bearer token returns 401 Unauthorized."""
    payload = {
        "model": "neolith-financial-agent",
        "messages": [{"role": "user", "content": "What is our balance?"}],
        "stream": True,
    }
    response = elevenlabs_client.post(
        ELEVENLABS_URL,
        json=payload,
        headers={"Authorization": "Bearer wrong_invalid_secret_token"},
    )
    assert response.status_code == 401
    assert "Invalid integration bearer token" in response.text


def test_elevenlabs_malformed_messages_rejected(elevenlabs_client: TestClient) -> None:
    """Request with no user messages returns 400 Bad Request."""
    payload = {
        "model": "neolith-financial-agent",
        "messages": [{"role": "assistant", "content": "Hello"}],
        "stream": True,
    }
    response = elevenlabs_client.post(
        ELEVENLABS_URL,
        json=payload,
        headers={"Authorization": f"Bearer {TEST_BEARER_TOKEN}"},
    )
    assert response.status_code == 400
    assert "user message" in response.text.lower()


def test_elevenlabs_valid_request_returns_sse_stream_and_done(
    elevenlabs_client: TestClient,
) -> None:
    """Valid voice request returns text/event-stream chunks terminating with data: [DONE]."""
    payload = {
        "model": "neolith-financial-agent",
        "messages": [
            {
                "role": "user",
                "content": "Pay INV-001 if the invoice is valid and within our software budget.",
            }
        ],
        "stream": True,
        "user": "voice-user-123",
    }
    response = elevenlabs_client.post(
        ELEVENLABS_URL,
        json=payload,
        headers={"Authorization": f"Bearer {TEST_BEARER_TOKEN}"},
    )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    lines = response.text.strip().split("\n\n")
    assert len(lines) >= 2

    # Verify final sentinel is data: [DONE]
    assert lines[-1].strip() == "data: [DONE]"

    # Verify OpenAI chunk structure for first chunk
    first_chunk_line = lines[0].strip()
    assert first_chunk_line.startswith("data: ")
    chunk_json = json.loads(first_chunk_line[len("data: ") :])
    assert chunk_json["object"] == "chat.completion.chunk"
    assert "choices" in chunk_json
    assert len(chunk_json["choices"]) > 0

    content = chunk_json["choices"][0]["delta"]["content"]
    assert "INV-001" in content
    assert "not authorised or executed" in content


def test_elevenlabs_protected_tools_not_exposed(elevenlabs_client: TestClient) -> None:
    """Voice adapter does not expose banking write execution tools directly."""
    payload = {
        "model": "neolith-financial-agent",
        "messages": [{"role": "user", "content": "Directly execute pay_invoice now"}],
        "stream": True,
    }
    response = elevenlabs_client.post(
        ELEVENLABS_URL,
        json=payload,
        headers={"Authorization": f"Bearer {TEST_BEARER_TOKEN}"},
    )

    assert response.status_code == 200
    assert "data: [DONE]" in response.text
    # Ensure no claim of direct execution
    assert "executed" not in response.text.lower() or "not authorised or executed" in response.text
