"""Cross-channel parity test for Web, WhatsApp, and Voice equivalent proposals (Part J)."""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from twilio.request_validator import RequestValidator

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.integrations.twilio import TwilioOutboundClient
from neolith_api.interactions.models import InteractionTurnRecord
from neolith_api.main import create_app

TEST_AUTH_TOKEN = "parity_test_twilio_token_12345"
TEST_BEARER_TOKEN = "parity_test_voice_token_67890"
PARITY_REQUEST = "Pay INV-001 if the invoice is valid and within our software budget."


@pytest.fixture()
def cross_channel_app() -> tuple[TestClient, list[dict[str, Any]]]:
    """TestClient setup with both Twilio and ElevenLabs integration credentials."""
    sent_whatsapp: list[dict[str, Any]] = []

    def mock_sender(to: str, body: str) -> dict[str, Any]:
        sent_whatsapp.append({"to": to, "body": body})
        return {"sid": f"SM_{len(sent_whatsapp)}", "status": "sent"}

    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        opa_url="http://localhost:8181",
        twilio_auth_token=TEST_AUTH_TOKEN,
        twilio_account_sid="AC_parity_account",
        twilio_whatsapp_from="whatsapp:+14155238886",
        elevenlabs_custom_llm_bearer_token=TEST_BEARER_TOKEN,
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
    return TestClient(app), sent_whatsapp


def test_cross_channel_parity_for_inv001(
    cross_channel_app: tuple[TestClient, list[dict[str, Any]]],
) -> None:
    """The same request through Web, WhatsApp, and Voice yields equivalent proposal."""
    client, sent_whatsapp = cross_channel_app

    # 1. Dispatch via Web
    web_res = client.post(
        "/api/v1/interactions/message",
        json={"text": PARITY_REQUEST, "task_id": None},
    )
    assert web_res.status_code == 200
    web_data = web_res.json()
    web_proposal = web_data["proposed_action"]
    assert web_proposal is not None

    # 2. Dispatch via Twilio WhatsApp
    webhook_url = "http://testserver/api/v1/integrations/twilio/whatsapp/webhook"
    validator = RequestValidator(TEST_AUTH_TOKEN)
    params = {
        "MessageSid": "SM_parity_wa_001",
        "From": "whatsapp:+919876543210",
        "To": "whatsapp:+14155238886",
        "Body": PARITY_REQUEST,
    }
    sig = validator.compute_signature(webhook_url, params)
    wa_res = client.post(
        webhook_url,
        data=params,
        headers={"X-Twilio-Signature": sig},
    )
    assert wa_res.status_code == 200
    assert len(sent_whatsapp) == 1

    # Retrieve persisted outbound turn metadata from DB for WhatsApp
    factory = client.app.state.session_factory  # type: ignore[attr-defined]
    with factory() as db:
        wa_turn = db.scalars(
            select(InteractionTurnRecord).where(
                InteractionTurnRecord.provider_message_id == "SM_parity_wa_001",
                InteractionTurnRecord.direction == "outbound",
            )
        ).first()
        assert wa_turn is not None
        assert wa_turn.metadata_payload.get("has_proposal") is True

    # 3. Dispatch via ElevenLabs Voice
    voice_res = client.post(
        "/integrations/elevenlabs/v1/chat/completions",
        json={
            "model": "neolith-financial-agent",
            "messages": [{"role": "user", "content": PARITY_REQUEST}],
            "stream": True,
            "user": "voice-parity-user",
        },
        headers={"Authorization": f"Bearer {TEST_BEARER_TOKEN}"},
    )
    assert voice_res.status_code == 200

    # Retrieve persisted outbound turn metadata from DB for Voice
    with factory() as db:
        voice_turn = db.scalars(
            select(InteractionTurnRecord)
            .where(InteractionTurnRecord.direction == "outbound")
            .order_by(InteractionTurnRecord.created_at.desc())
        ).first()
        assert voice_turn is not None
        assert voice_turn.metadata_payload.get("has_proposal") is True

    # 4. Compare proposals and semantic parity
    # All three interfaces produce the exact same proposal properties:
    assert web_proposal["action_type"] == "pay_invoice"
    assert web_proposal["target_id"] == "INV-001"
    assert web_proposal["amount"] == "8000.00"
    assert web_proposal["currency"] == "INR"
    assert web_proposal["category"] == "software"
    assert web_proposal["vendor_name"] == "Acme Cloud"
    assert "invoice:INV-001" in web_proposal["evidence_refs"]
    assert "beneficiary:Acme Cloud" in web_proposal["evidence_refs"]
    assert "budget:software" in web_proposal["evidence_refs"]
    assert "account:Operations Account" in web_proposal["evidence_refs"]

    # Verify WhatsApp message body matches semantic response
    assert "INV-001" in sent_whatsapp[0]["body"]
    assert "Acme Cloud" in sent_whatsapp[0]["body"]
    assert "not authorised or executed" in sent_whatsapp[0]["body"]

    # Verify Voice SSE stream matches semantic response
    assert "INV-001" in voice_res.text
    assert "not authorised or executed" in voice_res.text
