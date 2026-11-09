"""Tests for Twilio WhatsApp ingress adapter (signature validation, idempotency, masking)."""

import logging
from typing import Any

import pytest
from fastapi.testclient import TestClient
from twilio.request_validator import RequestValidator

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.integrations.twilio import TwilioOutboundClient
from neolith_api.interactions.service import mask_phone_number
from neolith_api.main import create_app

TEST_AUTH_TOKEN = "deterministic_auth_token_for_tests_123456"
WEBHOOK_URL = "http://testserver/api/v1/integrations/twilio/whatsapp/webhook"


@pytest.fixture()
def twilio_client() -> tuple[TestClient, list[dict[str, Any]]]:
    """TestClient configured with deterministic Twilio auth and mock messages collector."""
    sent_messages: list[dict[str, Any]] = []

    def mock_sender(to: str, body: str) -> dict[str, Any]:
        sent_messages.append({"to": to, "body": body})
        return {"sid": f"SM{len(sent_messages)}", "status": "sent"}

    settings = Settings(
        DATABASE_URL="sqlite+pysqlite:///:memory:",
        REDIS_URL="redis://localhost:6379/0",
        OPA_URL="http://localhost:8181",
        TWILIO_AUTH_TOKEN=TEST_AUTH_TOKEN,
        TWILIO_ACCOUNT_SID="AC_test_account_sid",
        TWILIO_WHATSAPP_FROM="whatsapp:+14155238886",
    )
    app = create_app(settings=settings)
    engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(engine, seed_if_empty=True)
    app.state.db_engine = engine
    app.state.session_factory = factory
    app.state.test_twilio_outbound = TwilioOutboundClient(
        account_sid=settings.twilio_account_sid,
        auth_token=settings.twilio_auth_token,
        from_number=settings.twilio_whatsapp_from,
        mock_sender=mock_sender,
    )
    return TestClient(app), sent_messages


def test_twilio_valid_signature_accepted(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """Webhook with valid X-Twilio-Signature returns 200 OK and triggers Financial Agent."""
    client, sent_messages = twilio_client
    validator = RequestValidator(TEST_AUTH_TOKEN)

    params = {
        "MessageSid": "SM_valid_sig_001",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": "Pay INV-001 if the invoice is valid and within our software budget.",
    }
    signature = validator.compute_signature(WEBHOOK_URL, params)

    response = client.post(
        WEBHOOK_URL,
        data=params,
        headers={"X-Twilio-Signature": signature},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")
    assert "<Response></Response>" in response.text
    # Check background outbound reply was dispatched
    assert len(sent_messages) == 1
    assert sent_messages[0]["to"] == "whatsapp:+919876543210"
    assert "INV-001" in sent_messages[0]["body"]
    assert "not authorised or executed" in sent_messages[0]["body"]


def test_twilio_invalid_signature_rejected(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """Webhook with invalid X-Twilio-Signature returns 403 Forbidden."""
    client, _ = twilio_client

    params = {
        "MessageSid": "SM_invalid_sig_002",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": "Pay INV-001",
    }

    response = client.post(
        WEBHOOK_URL,
        data=params,
        headers={"X-Twilio-Signature": "invalid_forged_signature"},
    )

    assert response.status_code == 403
    assert "Invalid Twilio signature" in response.text


def test_twilio_missing_signature_rejected(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """Webhook missing X-Twilio-Signature header returns 403 Forbidden."""
    client, _ = twilio_client

    params = {
        "MessageSid": "SM_missing_sig_003",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": "Pay INV-001",
    }

    response = client.post(WEBHOOK_URL, data=params)

    assert response.status_code == 403
    assert "Missing Twilio signature" in response.text


def test_twilio_missing_required_fields_rejected(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """Webhook missing required MessageSid/From/To/Body returns 400 Bad Request."""
    client, _ = twilio_client
    validator = RequestValidator(TEST_AUTH_TOKEN)

    # Missing Body
    params = {
        "MessageSid": "SM_missing_fields_004",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
    }
    signature = validator.compute_signature(WEBHOOK_URL, params)

    response = client.post(
        WEBHOOK_URL,
        data=params,
        headers={"X-Twilio-Signature": signature},
    )

    assert response.status_code == 400


def test_twilio_duplicate_messagesid_is_idempotent(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """Delivering the same MessageSid twice does not trigger duplicate agent runs or tasks."""
    client, sent_messages = twilio_client
    validator = RequestValidator(TEST_AUTH_TOKEN)

    params = {
        "MessageSid": "SM_idempotent_test_005",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": "What is our Operations Account balance?",
    }
    signature = validator.compute_signature(WEBHOOK_URL, params)

    # First delivery
    res1 = client.post(
        WEBHOOK_URL,
        data=params,
        headers={"X-Twilio-Signature": signature},
    )
    assert res1.status_code == 200
    assert len(sent_messages) == 1

    # Second delivery with exact same MessageSid
    res2 = client.post(
        WEBHOOK_URL,
        data=params,
        headers={"X-Twilio-Signature": signature},
    )
    assert res2.status_code == 200
    # Sent messages count remains 1 (no duplicate execution)
    assert len(sent_messages) == 1


def test_phone_number_masking_utility() -> None:
    """Assert phone numbers are cleanly masked and never leaked in full."""
    assert mask_phone_number("+919876543210") == "+9198****3210"
    assert mask_phone_number("whatsapp:+14155238886") == "whatsapp:+1415****886"
    assert mask_phone_number("") == ""
    assert mask_phone_number(None) == ""


def test_phone_numbers_not_emitted_in_normal_logs(
    twilio_client: tuple[TestClient, list[dict[str, Any]]],
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Full raw phone number must not appear unmasked in application logs."""
    client, _ = twilio_client
    validator = RequestValidator(TEST_AUTH_TOKEN)

    raw_phone = "+919876543210"
    params = {
        "MessageSid": "SM_mask_test_006",
        "From": f"whatsapp:{raw_phone}",
        "To": "whatsapp:+14155238886",
        "Body": "What is our Operations Account balance?",
    }
    signature = validator.compute_signature(WEBHOOK_URL, params)

    with caplog.at_level(logging.INFO):
        client.post(
            WEBHOOK_URL,
            data=params,
            headers={"X-Twilio-Signature": signature},
        )

    # Check logs do NOT contain the unmasked phone number
    assert raw_phone not in caplog.text
    # Masked version should be present
    assert "+9198****3210" in caplog.text
