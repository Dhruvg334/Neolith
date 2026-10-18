# F14 — Observability, Logging and Debugging

## Purpose

Provide end-to-end operational visibility from user goal to enterprise execution.

## Trace

```text
task
→ agent run
→ retrieval/tool calls
→ execution proposal
→ governance evaluation
→ policy
→ budget reservation
→ approval/permit
→ protected service
→ result
→ receipt
```

## Required correlation IDs

- task ID;
- trace ID;
- action ID;
- agent run ID;
- policy decision ID;
- reservation ID;
- approval ID;
- permit ID;
- receipt ID.

## Metrics

- task completion;
- action allow/deny/review;
- governance latency;
- OPA latency;
- reservation latency;
- approval wait time;
- permit failures;
- replay attempts;
- agent model calls;
- tokens/cost where available;
- tool failures.

## Logs

Structured JSON.

Do not log:

- API keys;
- tokens;
- private keys;
- raw sensitive user data;
- hidden chain-of-thought.

## Debug workflow

1. find task/action;
2. inspect state;
3. inspect governance reasons;
4. inspect policy version;
5. inspect reservation;
6. inspect permit;
7. inspect tool result;
8. verify receipt;
9. replay scenario.

## Acceptance

- one trace links end-to-end;
- critical events are not sampled away;
- logs contain no known secrets;
- operator can locate reason for denial.
