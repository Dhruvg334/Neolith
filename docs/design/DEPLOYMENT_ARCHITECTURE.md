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

## Hosted academic demo

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
- demo.

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
- demo can be reset reproducibly.
