# API Specification

Machine-readable contract is maintained in `specs/openapi.yaml`.

## Conventions

- base path: `/api/v1`;
- JSON;
- UUID identifiers;
- UTC timestamps;
- money as decimal string;
- RFC-style problem details;
- trace ID on responses;
- idempotency key on protected writes.

## User/task APIs

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/{task_id}`
- `POST /tasks/{task_id}/message`
- `POST /tasks/{task_id}/cancel`
- `GET /tasks/{task_id}/timeline`

## Registry APIs

- `POST /agents`
- `GET /agents`
- `POST /agents/{agent_id}/versions`
- `POST /tools`
- `GET /tools`
- `POST /tools/{tool_id}/versions`

## Permission APIs

- `POST /permissions`
- `GET /permissions`
- `GET /permissions/effective`

## Policy APIs

- `POST /policies`
- `POST /policies/{id}/versions`
- `POST /policy-versions/{id}/validate`
- `POST /policy-versions/{id}/simulate`
- `POST /policy-versions/{id}/activate`
- `POST /policies/{id}/rollback`

## Budget APIs

- `POST /budgets`
- `GET /budgets`
- `GET /budgets/{id}`
- `GET /budgets/{id}/reservations`

## Governance APIs

- `POST /actions/evaluate`
- `GET /actions/{action_id}`
- `POST /actions/{action_id}/result`
- `POST /actions/{action_id}/reconcile`

## Approval APIs

- `GET /approvals`
- `POST /approvals/{id}/approve`
- `POST /approvals/{id}/reject`

## Permit APIs

- `POST /permits/{id}/consume`
- `GET /permits/{id}/status`

## Revocation APIs

- `POST /agents/{id}/quarantine`
- `POST /revocations`
- `POST /system/emergency-stop`
- `POST /system/restore`

## Audit APIs

- `GET /receipts`
- `GET /receipts/{id}`
- `POST /receipts/{id}/verify`

## Evaluation APIs

- `GET /evaluation/suites`
- `POST /evaluation/runs`
- `GET /evaluation/runs/{id}`

## Key reason-code groups

Identity:
`IDENTITY_UNKNOWN`, `AGENT_UNKNOWN`, `AGENT_VERSION_INACTIVE`.

Permission:
`PERMISSION_MISSING`, `RESOURCE_SCOPE_DENIED`, `TOOL_NOT_ALLOWED`.

Policy:
`POLICY_DENY`, `POLICY_UNAVAILABLE`, `POLICY_CONFLICT`.

Budget:
`BUDGET_EXCEEDED`, `ACTION_LIMIT_EXCEEDED`, `RESERVATION_CONFLICT`.

Risk:
`HIGH_RISK_REVIEW_REQUIRED`, `OBJECTIVE_MISMATCH`.

Approval:
`APPROVAL_REQUIRED`, `APPROVAL_REJECTED`, `APPROVAL_EXPIRED`.

Permit:
`PERMIT_EXPIRED`, `PERMIT_REPLAY`, `PERMIT_REVOKED`, `PARAMETER_HASH_MISMATCH`, `CONTEXT_HASH_MISMATCH`.

System:
`EMERGENCY_STOP_ACTIVE`, `RECONCILIATION_REQUIRED`, `TOOL_UNAVAILABLE`.

## Planned interaction and external-interface APIs

These endpoints are introduced in Phase 2 and all terminate at the same Financial AI Agent service boundary.

### Web / canonical interaction

- `POST /api/v1/interactions/message`

Accepts a web-originated user turn, creates or resolves a task/session and returns a typed interface response.

### Twilio WhatsApp

- `POST /api/v1/integrations/twilio/whatsapp/webhook`

Provider requirements:

- form payload support;
- `X-Twilio-Signature` validation using the official Twilio SDK;
- `MessageSid` idempotency;
- prompt acknowledgement;
- masked sender identifiers in logs;
- outbound delivery through Twilio Messaging API.

### ElevenLabs Custom LLM

- `POST /integrations/elevenlabs/v1/chat/completions`

Requirements:

- dedicated integration bearer token;
- OpenAI-compatible Chat Completions request shape;
- Server-Sent Events streaming response;
- final `[DONE]` event;
- request routed into the same Financial AI Agent workflow;
- no direct protected financial tool execution from ElevenLabs.

### Interface-neutral contracts

- `specs/schemas/interaction-turn.schema.json`
- `specs/schemas/interface-response.schema.json`
- `specs/schemas/financial-action-proposal.schema.json`

Channel/provider identity is never treated as financial execution authority.
