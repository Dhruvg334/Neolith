# F12 — Memory and Governed RAG

## Purpose

Provide useful task continuity and grounded retrieval without allowing memory to become authority.

## Memory classes

### Working memory

Current task state:

- objective;
- plan;
- retrieved candidates;
- completed steps;
- approvals;
- tool results.

Persist using LangGraph checkpointing.

### Structured operational memory

Authoritative records:

- users;
- agents;
- tools;
- permissions;
- policies;
- budgets;
- actions;
- receipts;
- incidents.

Stored in PostgreSQL.

### Semantic memory

Non-authoritative retrieval:

- policy guidance;
- prior incidents;
- vendor documentation;
- remediation notes.

Optional pgvector or equivalent.

## RAG use cases

- vendor/service information;
- organisational policy explanation;
- incident investigation;
- feature documentation.

## RAG controls

- approved corpus only;
- source IDs;
- tenant/project filter;
- version/date;
- citation;
- stale-source handling;
- no retrieved text may increase permission.

## Not allowed

"User preferred vendor X last time" cannot override budget or policy.

## Acceptance

- working state survives workflow pause;
- retrieval identifies source;
- retrieval failure does not fabricate policy;
- semantic memory cannot change execution authority.
