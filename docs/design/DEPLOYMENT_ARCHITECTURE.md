# Deployment Architecture

## Local development

Docker Compose dependencies:

- PostgreSQL;
- Redis;
- OPA;
- optional Jaeger / OTel Collector.

Application processes:

- Next.js;
- FastAPI;
- LangGraph worker;
- tool simulator.

## Hosted academic presentation environment

Recommended separation:

- web frontend;
- API;
- agent worker;
- OPA;
- tool simulator;
- managed PostgreSQL;
- managed Redis;
- trace backend.

## Environment separation

- local;
- development;
- presentation / staging.

Each has separate:

- database;
- Redis;
- signing key;
- model credentials;
- policy bundle.

## CI requirements

- backend lint/type/test;
- frontend lint/type/test;
- JSON Schema/OpenAPI validation;
- Rego tests;
- migration tests;
- secret scan;
- deterministic evaluation smoke tests.

No paid model API key is required for CI.

## Deployment gate

- all critical security invariants pass;
- seed/reset script works;
- no secret exposed;
- current policy bundle identified;
- reference environment can be reset reproducibly.

## Public interaction endpoints

Twilio and ElevenLabs require externally reachable HTTPS endpoints in the deployed presentation environment.

Expose only the required ingress routes through the public API service:

```text
POST /api/v1/integrations/twilio/whatsapp/webhook
POST /integrations/elevenlabs/v1/chat/completions
```

Deployment requirements:

- valid TLS certificate;
- provider secrets in the platform secret store;
- no integration secret in Next.js public environment variables;
- request-size and rate limits;
- structured redaction for phone/provider identifiers;
- provider authentication before task processing;
- webhooks remain separate from protected financial service endpoints.

Local tunnels such as ngrok may be used for development only. The final presentation environment should use stable hosted HTTPS URLs where possible.
