# Implementation Roadmap

Build one vertical slice at a time. Do not introduce later-stage authority or execution mechanisms while the current stage has failing gates.

## Completed — Phase 0: Repository Foundation

Delivered:

- monorepo;
- Next.js shell;
- FastAPI health/readiness service;
- PostgreSQL/Redis/OPA/Jaeger Compose;
- contract validation;
- CI;
- project documentation baseline.

Baseline commit:

```text
chore: establish Neolith repository foundation and contracts
```

## Completed — Phase 1: Core Data and Financial Sandbox

Delivered:

- users;
- agents/versions;
- tools/versions;
- tasks;
- budgets;
- SQLAlchemy/Alembic persistence;
- deterministic Neolith Demo Corp financial data;
- accounts, invoices, beneficiaries and transactions;
- financial read APIs;
- tool metadata;
- permit-gated financial write simulator stubs;
- initial dashboard/accounts/agent/tasks/operator UI.

The financial sandbox is the primary reference application. Neolith remains domain-independent.

---

## Phase 2 — Financial AI Agent and Interaction Core

### 2A. Financial AI Agent

Deliver:

- LangGraph financial workflow;
- intent and entity extraction;
- clarification state;
- financial context retrieval through read-only tools;
- deterministic/mock model path for CI;
- provider-backed model adapter for local/demo use;
- planning and evidence tracking;
- typed `FinancialActionProposal` output;
- handling for proposal-only mode before governance exists.

Gate:

- `INV-001`, `INV-002` and `INV-003` requests produce correct structured proposals without executing protected writes;
- prompt-injected invoice/vendor text does not create a protected side effect;
- CI works without a live model credential.

### 2B. Multi-Channel Interaction Interfaces

Deliver:

- transport-neutral Interaction Core;
- `InteractionTurn` / `InterfaceResponse` persistence and service boundary;
- web message endpoint;
- Twilio WhatsApp webhook adapter with signature validation and `MessageSid` idempotency;
- outbound WhatsApp response delivery;
- ElevenLabs Custom LLM OpenAI-compatible streaming endpoint;
- channel-session mapping;
- masked provider identifiers in logs;
- cross-channel parity tests.

Gate:

- web and WhatsApp requests route through the same Financial Agent workflow;
- ElevenLabs endpoint routes through that same workflow and returns valid streaming output;
- no interface adapter can invoke a protected financial write directly.

Target implementation commit:

```text
feat: add financial agent and multichannel interaction adapters
```

---

## Phase 3 — Identity, Permissions and Policy Runtime

Deliver:

- execution-request construction from `FinancialActionProposal`;
- workload/agent-version validation;
- user/agent permission bindings;
- OPA client and policy-input builder;
- Rego financial reference rules;
- structured reason codes;
- `POST /api/v1/actions/evaluate`;
- deterministic base risk tier;
- `ALLOW`, `DENY`, `REVIEW` decisions.

Gate:

- `INV-001` → `ALLOW`;
- `INV-002` → `REVIEW`;
- `INV-003` → `DENY`;
- equivalent proposal has equivalent decision regardless of Web, WhatsApp or Voice origin;
- LLM output cannot convert a deterministic deny into allow.

Target commit:

```text
feat: enforce financial proposals through Neolith governance runtime
```

---

## Phase 4 — Transactional Budget and Execution Permits

Deliver:

- Redis atomic category-budget reservation;
- durable PostgreSQL reservation record;
- idempotent reservation/commit/release;
- canonical action hashing;
- Ed25519 JWS permit signing;
- short expiry;
- exact tool/operation/parameter binding;
- atomic nonce consumption;
- protected `pay_invoice` execution;
- result reconciliation.

Gate:

- happy-path `INV-001` executes;
- concurrent overspend remains zero;
- mutated amount/vendor is rejected;
- permit replay is rejected;
- protected simulator has no ungoverned bypass path.

Target commit:

```text
feat: add transactional financial execution and single-use permits
```

---

## Phase 5 — Human Approval and Decision Receipts

Deliver:

- approval model/API;
- exact action-hash binding;
- approval expiry;
- LangGraph interrupt/resume;
- approval UI;
- append-only Decision Receipts;
- receipt hash chain;
- receipt verification UI.

Gate:

- `INV-002` pauses at `REVIEW`;
- approved exact action resumes;
- modified action requires a new approval;
- altered receipt fails verification.

Target commit:

```text
feat: bind human approval to auditable financial execution
```

---

## Phase 6 — Revocation, Adaptive Risk and Incident Control

Deliver:

- agent quarantine;
- system emergency stop;
- monotonically increasing revocation epoch;
- old-permit invalidation;
- semantic objective-alignment signal;
- suspicious-action/anomaly signal where justified;
- incident timeline.

Gate:

- issued permit fails after stop/quarantine when its epoch is stale;
- model-risk failure cannot bypass deterministic controls;
- incident evidence identifies containment and affected actions.

Target commit:

```text
feat: add runtime revocation and adaptive financial risk controls
```

---

## Phase 7 — Observability and Assurance Lab

Deliver:

- end-to-end OpenTelemetry traces;
- model/tool/policy/governance spans;
- structured operational metrics;
- scenario runner;
- prompt-injection, budget-race, replay, mutation and stop tests;
- version manifests;
- regression reports.

Gate:

- one trace follows interface → agent → governance → financial service → receipt;
- critical deterministic security scenarios pass;
- agent quality and governance correctness are reported separately.

Target commit:

```text
feat: add end-to-end assurance and governance observability
```

---

## Phase 8 — UX, Deployment and Academic Demo

Deliver:

- polished Web Financial Agent interface;
- WhatsApp demo flow;
- ElevenLabs voice demo flow;
- operator/approval/receipt screens;
- deterministic seed/reset;
- hosted services;
- fallback demo procedure;
- documentation screenshots and diagrams;
- final evaluation results.

Gate:

- clean reset → web demo succeeds;
- clean reset → WhatsApp demo succeeds;
- clean reset → voice demo succeeds when ElevenLabs is configured;
- no demo path bypasses Neolith governance;
- final README and private decision log match the release.

Target commit:

```text
release: complete Neolith governed-agent demonstration
```
