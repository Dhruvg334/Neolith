# F15 — Evaluation and Assurance Lab

## Purpose

Treat safety, quality and regression testing as part of the system rather than ad hoc demo testing.

## Evaluation dimensions

### Agent quality

- intent extraction;
- recommendation quality;
- source grounding;
- tool selection;
- plan adherence;
- recovery.

### Governance correctness

- permission;
- policy;
- budget;
- approval;
- permit;
- revocation;
- audit.

### Security

- prompt injection;
- tool description injection;
- privilege escalation;
- replay;
- mutation;
- budget race;
- memory poisoning;
- bypass attempt.

### Operational

- latency;
- model calls;
- token usage;
- cost;
- failure rate.

## Harness record

Each run stores:

- scenario;
- dataset version;
- agent version;
- prompt version;
- model;
- policy version;
- tool versions;
- expected result;
- actual result;
- trace;
- latency;
- cost;
- pass/fail.

## Evaluation policy

Use deterministic assertions for security invariants.

Model-as-judge may assist qualitative evaluation only after calibration.

## Release blockers

- protected bypass succeeds;
- permit replay succeeds;
- mutation succeeds;
- budget overshoots;
- critical policy test fails;
- cross-user data access succeeds.

## Acceptance

- same scenario can be rerun;
- result links exact versions;
- failure case is inspectable;
- reports separate agent quality from governance correctness.
