# Component Design

## FastAPI API

Responsibilities:

- authentication and authorisation;
- CRUD for users, agents, tools, policies and budgets;
- task/action APIs;
- governance orchestration;
- permit and receipt services;
- operator APIs;
- evaluation metadata.

Must remain stateless between requests except through PostgreSQL/Redis.

## LangGraph Agent Worker

Responsibilities:

- primary user-task graph;
- optional specialist subgraphs;
- persisted checkpoints;
- human interrupt integration;
- LLM calls;
- approved read tools;
- structured action proposal.

It may not hold protected enterprise credentials.

## Open Policy Agent

Responsibilities:

- deterministic organisational policy;
- reason codes;
- approval requirements;
- parameter constraints;
- hard denies.

Policy input is built server-side.

## PostgreSQL

Authoritative:

- identities;
- agent/tool versions;
- tasks/plans;
- permissions;
- policies metadata;
- budgets;
- actions;
- decisions;
- approvals;
- permits metadata;
- receipts;
- incidents;
- evaluation metadata.

## Redis

Low-latency coordination:

- idempotency;
- budget/quota reservation;
- permit nonce/consume state;
- revocation epoch cache;
- optional distributed locks;
- short TTL runtime cache.

Redis state must be reconcilable.

## Protected Service Adapter

Responsibilities:

- verify execution permit;
- recompute hashes;
- check current revocation;
- atomically consume permit;
- call enterprise service;
- report result.

## Mock Procurement Service

Stores synthetic subscriptions and execution side effects.

No external purchase.

## OpenTelemetry Pipeline

Carries traces, metrics and structured correlation.

Correctness must not depend on observability backend.
