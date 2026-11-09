"""Twilio WhatsApp messaging client adapter with phone masking and test mocking (Part H)."""

import logging
from collections.abc import Callable
from typing import Any

from neolith_api.interactions.service import mask_phone_number

logger = logging.getLogger(__name__)


class TwilioOutboundClient:
    """Outbound WhatsApp messaging client sending replies via Twilio Messaging API."""

    def __init__(
        self,
        account_sid: str = "",
        auth_token: str = "",
        from_number: str = "",
        mock_sender: Callable[[str, str], dict[str, Any]] | None = None,
    ) -> None:
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.mock_sender = mock_sender

    def send_message(self, to: str, body: str) -> dict[str, Any]:
        """Send a WhatsApp message, masking destination phone number in logs."""
        masked_to = mask_phone_number(to)
        logger.info("Dispatching outbound WhatsApp message to %s", masked_to)

        if self.mock_sender is not None:
            return self.mock_sender(to, body)

        if not self.account_sid or not self.auth_token:
            msg = "Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are not configured."
            logger.error(msg)
            raise RuntimeError(msg)

        from twilio.rest import Client

        client = Client(self.account_sid, self.auth_token)
        message = client.messages.create(
            from_=self.from_number,
            to=to,
            body=body,
        )
        return {"sid": message.sid, "status": message.status, "to_masked": masked_to}
