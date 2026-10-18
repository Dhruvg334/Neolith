# Implementation Roadmap

Do not build later phases while the current phase has failing gates.

## Phase 0 — Repository Foundation

Deliver:

- monorepo;
- Next.js shell;
- FastAPI health service;
- PostgreSQL/Redis/OPA Compose;
- contract schemas;
- CI;
- `.gitignore`;
- `.env.example`;
- seed structure.

Gate:

- services start;
- schema validation passes;
- CI passes.

Commit:

```text
chore: establish Neolith repository foundation and contracts
```

## Phase 1 — Core Data and Registry

Deliver:

- users;
- agents/versions;
- tools/versions;
- tasks;
- PostgreSQL migrations;
- seed data;
- basic operator registry UI.

Gate:

- inactive/unknown agent cannot access protected action path.

Commit:

```text
feat: add Neolith identity, task, agent and tool registries
```

## Phase 2 — Primary Agent

Deliver:

- LangGraph task state;
- intent/constraint extraction;
- deterministic vendor catalogue;
- comparison;
- structured plan;
- provider adapter;
- mock provider for CI.

Gate:

- procurement recommendation works without protected execution.

Commit:

```text
feat: build grounded procurement planning agent
```

## Phase 3 — Permissions and Policy

Deliver:

- permission bindings;
- OPA integration;
- Rego policy;
- reason codes;
- policy tests;
- action evaluation API.

Gate:

- allow/deny fixtures pass.

Commit:

```text
feat: enforce permission and policy decisions independently of the agent
```

## Phase 4 — Budget and Permits

Deliver:

- budget model;
- atomic Redis reservation;
- idempotency;
- Ed25519 permit;
- protected adapter;
- mock procurement service.

Gate:

- happy-path execution;
- zero controlled overspend;
- replay/mutation rejected.

Commit:

```text
feat: add transactional budgets and single-use execution permits
```

## Phase 5 — Audit and Approval

Deliver:

- approval workflow;
- LangGraph interrupt/resume;
- decision receipts;
- hash chain;
- Receipt Explorer.

Gate:

- approved exact action resumes;
- altered receipt fails verification.

Commit:

```text
feat: add human approval and tamper-evident execution receipts
```

## Phase 6 — Revocation, Risk and Incident Control

Deliver:

- risk tiers;
- semantic alignment;
- quarantine;
- emergency stop;
- revocation epoch;
- incident timeline.

Gate:

- old permit fails after stop;
- model-risk failure cannot bypass deterministic controls.

Commit:

```text
feat: add adaptive risk signals and runtime containment controls
```

## Phase 7 — Observability and Assurance

Deliver:

- OTel traces;
- structured metrics/logs;
- evaluation harness;
- adversarial scenarios;
- regression report.

Gate:

- one trace covers user request through enterprise result;
- all critical scenarios pass.

Commit:

```text
feat: introduce Neolith assurance lab and end-to-end telemetry
```

## Phase 8 — UX and Academic Demo

Deliver:

- polished Task Workspace;
- operator dashboard;
- comparison UI;
- approvals;
- policies;
- budget view;
- receipts;
- demo seed/reset;
- documentation screenshots.

Gate:

- full repeatable demo from clean seed.

Commit:

```text
release: complete Neolith semester-project demonstration
```
