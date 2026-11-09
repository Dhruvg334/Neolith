# Interaction Interface Architecture

## 1. Objective

Neolith supports multiple user interfaces while keeping one Financial AI Agent and one governance/execution path.

The architecture must avoid this anti-pattern:

```text
Web Agent       → governance
WhatsApp Agent  → different logic
Voice Agent     → direct tools
```

The intended design is:

```text
                           ┌──────────────┐
                           │ Web UI       │
                           └──────┬───────┘
                                  │
                           ┌──────▼───────┐
                           │ Web Adapter  │
                           └──────┬───────┘
                                  │
┌──────────────┐           ┌──────▼───────┐           ┌──────────────────┐
│ WhatsApp     │──────────▶│ Interaction  │◀──────────│ ElevenLabs Voice │
│ via Twilio   │  adapter  │ Core         │  adapter  │ Agent            │
└──────────────┘           └──────┬───────┘           └──────────────────┘
                                  │
                         Canonical InteractionTurn
                                  │
                                  ▼
                         Financial AI Agent
                                  │
                         FinancialActionProposal
                                  │
                                  ▼
                         Neolith Governance
                                  │
                                  ▼
                       Protected Financial Sandbox
```

## 2. Interaction Core

The Interaction Core is a transport-neutral boundary between interfaces and the Financial Agent.

Responsibilities:

- validate the canonical interaction contract;
- resolve or create a channel session;
- associate an interaction with a Neolith task;
- preserve trace correlation;
- invoke the Financial Agent through one internal service interface;
- persist interaction status;
- return a transport-neutral `InterfaceResponse`.

Non-responsibilities:

- financial permission;
- OPA policy evaluation;
- budget reservation;
- approval decisions;
- execution permit issuance;
- protected financial execution.

## 3. Channel session model

A later database migration may introduce `channel_sessions` and `interaction_turns`.

Suggested `channel_sessions` fields:

- `id`;
- `channel` (`web`, `whatsapp`, `voice`);
- `provider` (`neolith_web`, `twilio`, `elevenlabs`);
- `external_session_ref`;
- `external_user_ref`;
- `user_id` nullable until identity mapping is established;
- `active_task_id` nullable;
- `status`;
- timestamps.

Suggested `interaction_turns` fields:

- `id`;
- `channel_session_id`;
- `task_id`;
- `provider_message_id` nullable;
- `direction` (`inbound`, `outbound`);
- `content`;
- `status`;
- `trace_id`;
- timestamps.

Provider identifiers are routing identifiers. They are not permission records.

## 4. Web adapter

Target endpoint:

```text
POST /api/v1/interactions/message
```

Request is the canonical `InteractionTurn` or a minimal web request that the server normalises into it.

This endpoint is the reference interface for frontend development and automated tests.

## 5. Twilio WhatsApp adapter

Target endpoint:

```text
POST /api/v1/integrations/twilio/whatsapp/webhook
```

Expected Twilio fields include `MessageSid`, `From`, `To` and `Body`, with provider payload handled as form data.

Processing order:

```text
receive webhook
→ validate X-Twilio-Signature
→ validate account/message identity
→ deduplicate MessageSid
→ persist inbound turn
→ acknowledge Twilio
→ enqueue/process Financial Agent turn
→ persist response
→ send outbound WhatsApp message
```

The application should use Twilio's official request validator rather than implementing signature calculation manually.

Long-running LLM work must not hold the webhook request open unnecessarily.

## 6. ElevenLabs voice adapter

Target endpoint:

```text
POST /integrations/elevenlabs/v1/chat/completions
```

The endpoint follows the OpenAI-compatible Chat Completions request/streaming response format required by ElevenLabs Custom LLM integration.

Processing order:

```text
validate integration bearer token
→ parse latest user turn + conversation context
→ map ElevenLabs user/session reference
→ InteractionTurn(channel="voice")
→ Financial Agent
→ InterfaceResponse
→ stream final text as SSE chunks
→ [DONE]
```

The adapter does not expose protected financial tools to ElevenLabs directly.

If ElevenLabs webhook tools are added later, they should be limited to clearly scoped read-only interfaces or route back into Neolith's governance APIs rather than protected services.

## 7. Identity and authority

Channel identity and Neolith authority are separate.

Examples:

- a WhatsApp number proves which channel address sent a message after Twilio verification;
- an ElevenLabs integration token proves the request came through the configured voice integration;
- neither automatically proves the user has `finance.invoice.pay` permission.

Until explicit user-binding is implemented, the reference application may map demo channels to a seeded demo user. That mapping must be visible, deterministic and restricted to non-production environments.

## 8. Idempotency

### Web

Use a client-generated interaction ID or idempotency key.

### WhatsApp

Use `MessageSid` as the provider idempotency identifier.

### Voice

Use a supplied conversation/session reference plus a turn identifier where available. If no provider turn identifier is available, Neolith generates an interaction ID and treats duplicate protection at the task/action layer separately.

## 9. Observability

Attach these attributes to traces where available:

- `neolith.interface.channel`;
- `neolith.interface.provider`;
- `neolith.interaction.id`;
- `neolith.channel_session.id`;
- `neolith.provider_message_id_hash`;
- `neolith.task.id`;
- `neolith.trace_id`.

Do not log full WhatsApp phone numbers by default.

## 10. Test strategy

Required interface tests:

- web request normalisation;
- Twilio valid signature;
- Twilio invalid signature;
- Twilio duplicate `MessageSid`;
- WhatsApp and web parity for the same financial request;
- ElevenLabs authentication;
- ElevenLabs malformed request;
- ElevenLabs SSE completion shape;
- voice request routes to the same Financial Agent service;
- protected financial write remains inaccessible from every adapter.
