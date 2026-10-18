# Evaluation Plan

## Evaluation question 1 — Can the agent complete the task?

Measure:

- constraint extraction accuracy;
- candidate retrieval;
- recommendation correctness on synthetic catalogue;
- task completion;
- tool-call efficiency.

## Evaluation question 2 — Does governance enforce the rules?

Measure exact outcomes for:

- permissions;
- policy;
- budget;
- approval;
- permit;
- revocation;
- audit.

These are deterministic and should not be scored by an LLM judge.

## Evaluation question 3 — Does the system resist agentic attacks?

Measure:

- prompt injection;
- indirect prompt injection;
- tool misuse;
- privilege escalation;
- replay;
- mutation;
- budget race;
- memory poisoning.

## Evaluation question 4 — Is the system usable?

User study / team evaluation:

- task clarity;
- recommendation clarity;
- approval clarity;
- ability to understand denial;
- ability to inspect audit trail.

## Evaluation question 5 — What is the operational cost?

Record:

- deterministic decision latency;
- model calls/task;
- tokens/task;
- tool calls/task;
- runtime failure rate.

## Reporting rule

Separate:

- observed measurements;
- design targets;
- inferred explanations.

Never present a generated value as measured.

## Baseline comparison

Compare three modes:

1. Ungoverned agent.
2. Prompt-only safety agent.
3. Neolith governed execution.

Use the same synthetic scenarios and show which unsafe actions reach the mock enterprise service.
