# F17 — Multi-Channel Interaction Interfaces

## Purpose

Allow users to interact with the same Neolith Financial AI Agent through three interfaces without creating three different reasoning or governance systems:

1. Web application.
2. WhatsApp through Twilio.
3. Voice through an ElevenLabs Agent using Neolith as its custom LLM backend.

The interface changes; the Financial Agent, task state, governance pipeline and protected execution path do not.

## Core rule

```text
Web / WhatsApp / Voice
        ↓
Channel Adapter
        ↓
Canonical InteractionTurn
        ↓
Financial AI Agent
        ↓
FinancialActionProposal
        ↓
Neolith Governance
        ↓
Protected Financial Service
```

A channel adapter may authenticate, normalise and transport a user message. It may not grant permission, approve a transaction, create budget, mint an execution permit or call a protected financial write directly.

## Canonical interaction contract

Every inbound interface normalises into an `InteractionTurn` containing:

- interaction ID;
- channel;
- provider;
- external session reference;
- external user reference;
- optional resolved Neolith user ID;
- optional task ID;
- user text;
- provider message ID;
- received timestamp;
- non-authoritative metadata.

Provider-specific fields remain at the adapter boundary and do not leak into the Financial Agent state unless intentionally mapped.

## Web interface

The website remains the primary inspectable interface for the academic presentation.

The web client sends a user message to the interaction API and receives a typed `InterfaceResponse`.

The web UI must show:

- user message;
- Financial Agent response;
- task state;
- financial context used;
- proposed action when present;
- later governance status and execution timeline.

## Twilio WhatsApp interface

### Inbound flow

1. Twilio sends an inbound WhatsApp webhook.
2. Neolith validates `X-Twilio-Signature` using the official Twilio SDK validator.
3. Neolith validates required webhook fields.
4. `MessageSid` is used as the provider idempotency key.
5. Sender and conversation references are mapped to a channel session.
6. The message is converted to `InteractionTurn(channel="whatsapp")`.
7. Neolith acknowledges the webhook promptly.
8. The Financial Agent processes the turn.
9. The outbound answer is sent through the Twilio Messaging API.

### Security requirements

- HTTPS in deployed environments.
- Signature validation is mandatory outside explicitly configured local tests.
- Do not implement custom Twilio signature cryptography when the official SDK is available.
- Duplicate webhook delivery must not duplicate tasks or protected actions.
- Phone numbers must be masked in application logs.
- Twilio credentials remain server-side environment secrets.
- A WhatsApp message cannot bypass the same governance path used by the website.

### Conversation rule

A Twilio sender maps to a Neolith channel session and active task. The raw phone address is provider-routing data, not authority.

## ElevenLabs voice interface

### Chosen integration model

ElevenLabs is a voice presentation layer for the same Neolith Financial Agent.

Neolith will expose an OpenAI-compatible custom LLM endpoint for the ElevenLabs Agent, using either the Chat Completions or Responses-compatible protocol. The first implementation target is streaming Chat Completions.

```text
Voice user
   ↓ speech
ElevenLabs Agent
   ↓ OpenAI-compatible request
Neolith ElevenLabs Adapter
   ↓ InteractionTurn(channel="voice")
Financial AI Agent
   ↓
InterfaceResponse
   ↓ streamed text
ElevenLabs
   ↓ speech
Voice user
```

The ElevenLabs Agent must not be configured with a direct protected payment tool that bypasses Neolith.

### Endpoint target

Planned endpoint:

```text
POST /integrations/elevenlabs/v1/chat/completions
```

It returns Server-Sent Events in the OpenAI-compatible streaming format expected by ElevenLabs.

### Authentication

Use a dedicated bearer token or equivalent secret configured in ElevenLabs and stored only in server-side environment variables.

This token authenticates the integration caller. It does not grant financial authority.

## Shared response contract

All interfaces receive or render the same logical response:

- interaction ID;
- task ID;
- trace ID;
- status;
- user-facing message;
- optional structured `FinancialActionProposal`;
- evidence references.

Supported response states initially:

```text
accepted
needs_clarification
proposal_ready
completed
error
```

`proposal_ready` means the agent has prepared a financial action proposal. It does not mean Neolith has authorised or executed the action.

## Failure handling

### WhatsApp

- invalid signature: reject;
- duplicate `MessageSid`: return success without duplicate processing;
- Financial Agent failure after webhook acknowledgement: record failed interaction and send a safe failure response if possible;
- Twilio outbound failure: preserve task state and retry through a bounded delivery policy.

### Voice

- invalid integration token: reject;
- malformed OpenAI-compatible payload: return 4xx;
- agent failure: return a concise safe response rather than fabricating success;
- streaming disconnect: preserve task state and allow the client to restart the conversational turn.

## Privacy

Channel identifiers are operational routing data.

- Do not include full phone numbers in normal logs or Decision Receipts.
- Do not use phone number or voice session ID as a permission grant.
- Channel metadata must not enter policy input unless explicitly needed and documented.
- Voice transcripts are task input and follow the same retention rules as web text.

## Acceptance criteria

- identical financial request through web and WhatsApp produces the same structured Financial Agent proposal, subject only to channel formatting;
- ElevenLabs endpoint routes to the same Financial Agent workflow;
- Twilio webhook signature is validated;
- duplicate Twilio messages are idempotent;
- no channel adapter contains financial policy logic;
- no channel can directly invoke `pay_invoice`, `transfer_funds`, `add_beneficiary` or `cancel_payment`;
- channel-specific credentials are absent from browser code, logs and repository history.
